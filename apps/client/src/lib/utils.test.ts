import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges Tailwind class names predictably", () => {
    expect(cn("px-2", "px-4", false && "hidden")).toBe("px-4");
  });
});
