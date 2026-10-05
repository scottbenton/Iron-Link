import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { useAuthStore } from "stores/auth.store";

import {
  OAuthRedirectError,
  parseOAuthRedirectError,
} from "lib/oauthRedirect.lib";

/**
 * Reads an OAuth error that Supabase appended to the redirect URL (for example
 * when the user cancels consent), then removes the error params from the URL
 * so a refresh doesn't show it again.
 *
 * supabase-js also detects these params while initializing (and clears any
 * stale local session), but it does not surface the error to the app or clean
 * up the URL. We wait for that initialization to finish before rewriting the
 * URL so we never remove params before supabase-js has read them.
 */
export function useOAuthRedirectError() {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const waitForInitialization = useAuthStore(
    (store) => store.waitForInitialization,
  );

  const [redirectError, setRedirectError] = useState<OAuthRedirectError>();

  useEffect(() => {
    const parsed = parseOAuthRedirectError(search, hash);
    if (!parsed) {
      return;
    }

    let cancelled = false;
    waitForInitialization()
      .catch(() => {
        // Initialization errors are reported by supabase-js itself; we still
        // want to show the redirect error below.
      })
      .finally(() => {
        if (cancelled) {
          return;
        }
        setRedirectError(parsed.error);
        navigate(
          { pathname, search: parsed.search, hash: parsed.hash },
          { replace: true },
        );
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, search, hash, navigate, waitForInitialization]);

  return redirectError;
}
