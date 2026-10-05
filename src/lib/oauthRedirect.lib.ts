import { getSafeContinuePath } from "./continuePath.lib";

const OAUTH_ERROR_PARAMS = [
  "error",
  "error_code",
  "error_description",
] as const;

const CONTINUE_PATH_PARAM = "continuePath";
const MAX_ERROR_DESCRIPTION_LENGTH = 300;

/**
 * Builds the URL an OAuth provider should send the user back to. The result is
 * always same-origin: only the in-app `continuePath` search param is carried
 * over from the current URL (and only when it is a safe same-origin path) so
 * the post-login redirect still works.
 */
export function buildOAuthRedirectUrl(
  origin: string,
  authPath: string,
  currentSearch: string,
): string {
  const redirectUrl = new URL(authPath, origin);
  const continuePath = getSafeContinuePath(
    new URLSearchParams(currentSearch).get(CONTINUE_PATH_PARAM),
    origin,
  );
  if (continuePath) {
    redirectUrl.searchParams.set(CONTINUE_PATH_PARAM, continuePath);
  }
  return redirectUrl.toString();
}

export interface OAuthRedirectError {
  error: string | null;
  code: string | null;
  description: string | null;
}

export interface ParsedOAuthRedirect {
  error: OAuthRedirectError;
  /** The search string with the error params removed (with leading "?" or empty). */
  search: string;
  /** The hash with the error params removed (with leading "#" or empty). */
  hash: string;
}

function readErrorParams(params: URLSearchParams): OAuthRedirectError | null {
  const error = params.get("error");
  const code = params.get("error_code");
  const description = params.get("error_description");
  if (!error && !code && !description) {
    return null;
  }
  return {
    error,
    code,
    description: description
      ? description.slice(0, MAX_ERROR_DESCRIPTION_LENGTH)
      : null,
  };
}

function stripErrorParams(params: URLSearchParams): string {
  OAUTH_ERROR_PARAMS.forEach((key) => params.delete(key));
  return params.toString();
}

/**
 * Supabase reports failed OAuth redirects (e.g. the user cancelled consent) by
 * appending `error`, `error_code`, and `error_description` to the redirect URL,
 * in the hash for the implicit flow and in the query string for some errors.
 * Search params take precedence over hash params, matching supabase-js.
 *
 * Returns null when the URL contains no OAuth error.
 */
export function parseOAuthRedirectError(
  search: string,
  hash: string,
): ParsedOAuthRedirect | null {
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));

  const error = readErrorParams(searchParams) ?? readErrorParams(hashParams);
  if (!error) {
    return null;
  }

  const cleanedSearch = stripErrorParams(searchParams);
  const cleanedHash = stripErrorParams(hashParams);

  return {
    error,
    search: cleanedSearch ? `?${cleanedSearch}` : "",
    hash: cleanedHash ? `#${cleanedHash}` : "",
  };
}
