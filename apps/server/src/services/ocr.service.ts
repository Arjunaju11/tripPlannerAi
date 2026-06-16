import { inflateSync } from "node:zlib";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";
import type { IOCRService } from "../interfaces/services.js";
import { AppError } from "../utils/app-error.js";

function decodeAscii85(input: string) {
  const clean = input.replace(/^<~/, "").replace(/~>.*$/s, "").replace(/\s/g, "");
  const bytes: number[] = [];
  let group = "";

  for (const char of clean) {
    if (char === "z" && group.length === 0) {
      bytes.push(0, 0, 0, 0);
      continue;
    }

    group += char;
    if (group.length === 5) {
      let value = 0;
      for (const digit of group) value = value * 85 + digit.charCodeAt(0) - 33;
      bytes.push((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255);
      group = "";
    }
  }

  if (group.length > 0) {
    const padding = 5 - group.length;
    group = group.padEnd(5, "u");
    let value = 0;
    for (const digit of group) value = value * 85 + digit.charCodeAt(0) - 33;
    const decoded = [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
    bytes.push(...decoded.slice(0, 4 - padding));
  }

  return Buffer.from(bytes);
}

function decodePdfString(input: string) {
  return input.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_match, escape: string) => {
    if (/^[0-7]+$/.test(escape)) return String.fromCharCode(parseInt(escape, 8));
    const escapes: Record<string, string> = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": ")", ")": ")", "\\": "\\" };
    return escape === "(" ? "(" : escapes[escape] ?? escape;
  });
}

function extractLiteralStrings(input: string) {
  const strings: string[] = [];
  const literalPattern = /\((?:\\.|[^\\()])*\)/g;
  for (const match of input.matchAll(literalPattern)) {
    strings.push(decodePdfString(match[0].slice(1, -1)));
  }
  return strings;
}

function extractTextFromContentStream(content: string) {
  const text: string[] = [];
  const arrayTextPattern = /\[((?:.|\n)*?)\]\s*TJ/g;
  const consumedArrays: string[] = [];

  for (const match of content.matchAll(arrayTextPattern)) {
    consumedArrays.push(match[0]);
    text.push(...extractLiteralStrings(match[1]));
  }

  let remaining = content;
  for (const array of consumedArrays) remaining = remaining.replace(array, " ");

  const textOperatorPattern = /(\((?:\\.|[^\\()])*\))\s*(?:Tj|'|")/g;
  for (const match of remaining.matchAll(textOperatorPattern)) {
    text.push(decodePdfString(match[1].slice(1, -1)));
  }

  return text.join(" ").replace(/\s+/g, " ").trim();
}

function extractTextWithContentStreamFallback(buffer: Buffer) {
  const pdf = buffer.toString("latin1");
  const streamPattern = /<<([\s\S]*?)>>\s*stream\r?\n?([\s\S]*?)endstream/g;
  const extracted: string[] = [];

  for (const match of pdf.matchAll(streamPattern)) {
    const dictionary = match[1];
    let stream = Buffer.from(match[2], "latin1");

    try {
      if (dictionary.includes("/ASCII85Decode")) stream = decodeAscii85(stream.toString("latin1"));
      if (dictionary.includes("/FlateDecode")) stream = inflateSync(stream);
      const text = extractTextFromContentStream(stream.toString("latin1"));
      if (text) extracted.push(text);
    } catch {
      continue;
    }
  }

  return extracted.join("\n").trim();
}

export class TesseractOCRService implements IOCRService {
  async extractText(file: Express.Multer.File) {
    if (file.mimetype === "application/pdf") {
      try {
        const parsed = await pdfParse(file.buffer);
        return parsed.text.trim();
      } catch (error) {
        const fallbackText = extractTextWithContentStreamFallback(file.buffer);
        if (fallbackText) return fallbackText;
        const message = error instanceof Error ? error.message : "Unknown PDF parsing error";
        throw new AppError(422, `Could not extract text from PDF: ${message}`);
      }
    }
    const worker = await createWorker("eng");
    try {
      const result = await worker.recognize(file.buffer);
      return result.data.text.trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown image OCR error";
      throw new AppError(422, `Could not extract text from image: ${message}`);
    } finally {
      await worker.terminate();
    }
  }
}

export class TextractOCRService implements IOCRService {
  async extractText(): Promise<string> {
    throw new AppError(501, "Textract OCR adapter is not configured in this MVP");
  }
}
