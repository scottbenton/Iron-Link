import { describe, expect, it } from "vitest";

import {
  buildOAuthRedirectUrl,
  parseOAuthRedirectError,
} from "../oauthRedirect.lib";

describe("buildOAuthRedirectUrl", () => {
  it("returns the auth page on the current origin", () => {
    expect(buildOAuthRedirectUrl("https://example.com", "/auth", "")).toBe(
      "https://example.com/auth",
    );
  });

  it("preserves the continuePath param", () => {
    expect(
      buildOAuthRedirectUrl(
        "http://localhost:5173",
        "/auth",
        "?continuePath=%2Fgames%2Fabc",
      ),
    ).toBe("http://localhost:5173/auth?continuePath=%2Fgames%2Fabc");
  });

  it("drops unrelated params such as stale OAuth errors", () => {
    expect(
      buildOAuthRedirectUrl(
        "https://example.com",
        "/auth",
        "?error=access_denied&continuePath=%2Fgames&foo=bar",
      ),
    ).toBe("https://example.com/auth?continuePath=%2Fgames");
  });

  it.each(["//evil.com", "/\\evil.com", "https://evil.com"])(
    "does not forward the unsafe continuePath %j",
    (continuePath) => {
      expect(
        buildOAuthRedirectUrl(
          "https://example.com",
          "/auth",
          `?${new URLSearchParams({ continuePath }).toString()}`,
        ),
      ).toBe("https://example.com/auth");
    },
  );

  it("stays on the given origin even when continuePath is an absolute URL", () => {
    const url = new URL(
      buildOAuthRedirectUrl(
        "https://example.com",
        "/auth",
        "?continuePath=https%3A%2F%2Fevil.example",
      ),
    );
    expect(url.origin).toBe("https://example.com");
    expect(url.pathname).toBe("/auth");
  });
});

describe("parseOAuthRedirectError", () => {
  it("returns null when there is no error", () => {
    expect(parseOAuthRedirectError("?continuePath=%2Fgames", "")).toBeNull();
    expect(parseOAuthRedirectError("", "#access_token=abc")).toBeNull();
  });

  it("reads errors from the hash and strips them", () => {
    expect(
      parseOAuthRedirectError(
        "?continuePath=%2Fgames",
        "#error=access_denied&error_code=403&error_description=User+cancelled",
      ),
    ).toEqual({
      error: {
        error: "access_denied",
        code: "403",
        description: "User cancelled",
      },
      search: "?continuePath=%2Fgames",
      hash: "",
    });
  });

  it("reads errors from the query string and keeps other params", () => {
    expect(
      parseOAuthRedirectError(
        "?continuePath=%2Fgames&error=server_error&error_description=Oops",
        "#other=1",
      ),
    ).toEqual({
      error: { error: "server_error", code: null, description: "Oops" },
      search: "?continuePath=%2Fgames",
      hash: "#other=1",
    });
  });

  it("strips error params from both locations when present in both", () => {
    const result = parseOAuthRedirectError(
      "?error=a&error_description=from+query",
      "#error=b&error_description=from+hash",
    );
    expect(result?.error.description).toBe("from query");
    expect(result?.search).toBe("");
    expect(result?.hash).toBe("");
  });

  it("truncates very long descriptions", () => {
    const result = parseOAuthRedirectError(
      `?error_description=${"a".repeat(1000)}`,
      "",
    );
    expect(result?.error.description).toHaveLength(300);
  });
});
