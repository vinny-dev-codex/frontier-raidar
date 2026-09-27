import { describe, expect, it } from "vitest";
import { parseModelJson } from "./model-json";

describe("parseModelJson", () => {
  it("parses plain JSON", () => {
    expect(parseModelJson('{"ok":true}')).toEqual({ ok: true });
  });

  it("unwraps a Markdown JSON fence", () => {
    expect(parseModelJson('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it("extracts the JSON object from surrounding model commentary", () => {
    expect(parseModelJson('Result follows:\n{"ok":true}\nDone.')).toEqual({ ok: true });
  });

  it("rejects output without a valid JSON object", () => {
    expect(() => parseModelJson("not json")).toThrow("valid JSON");
  });
});
