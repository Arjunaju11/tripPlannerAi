declare module "xss-clean" {
  import type { RequestHandler } from "express";
  export default function xssClean(): RequestHandler;
}
