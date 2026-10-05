import { describe, expect, it } from "vitest";

import { getSafeContinuePath } from "../continuePath.lib";

const ORIGIN = "https://example.com";

describe("getSafeContinuePath", () => {
  it.each([
    ["/games", "/games"],
    ["/games/abc", "/games/abc"],
    ["/games/abc?x=1#y", "/games/abc?x=1#y"],
    ["/", "/"],
    ["/worlds/a%2Fb", "/worlds/a%2Fb"],
  ])("allows the in-app path %j", (path, expected) => {
    expect(getSafeContinuePath(path, ORIGIN)).toBe(expected);
  });

  it.each([
    ["protocol-relative URL", "//evil.com"],
    ["protocol-relative URL with path", "//evil.com/games"],
    ["backslash after slash", "/\\evil.com"],
    ["backslash later in the path", "/games\\..\\x"],
    [
      "percent-encoded slashes decoded by URLSearchParams",
      new URLSearchParams("continuePath=%2F%2Fevil.com").get("continuePath"),
    ],
    ["absolute URL", "https://evil.com"],
    ["absolute URL on the same origin", "https://example.com/games"],
    ["javascript URL", "javascript:alert(1)"],
    ["relative path", "games"],
    ["empty string", ""],
    ["null", null],
    ["undefined", undefined],
    ["tab that the URL parser would strip", "/\t/evil.com"],
    ["newline that the URL parser would strip", "/\n/evil.com"],
    ["leading space", " /games"],
    ["space in path", "/games /x"],
    ["DEL character", "/games\u007f"],
  ])("rejects %s", (_label, path) => {
    expect(getSafeContinuePath(path, ORIGIN)).toBeNull();
  });

  it("normalizes dot segments without leaving the origin", () => {
    expect(getSafeContinuePath("/games/../../worlds", ORIGIN)).toBe("/worlds");
  });
});
