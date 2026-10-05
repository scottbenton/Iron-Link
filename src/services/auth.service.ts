import { pathConfig } from "pages/pathConfig";

import { buildOAuthRedirectUrl } from "lib/oauthRedirect.lib";
import { supabase } from "lib/supabase.lib";

import { AnalyticsService } from "./analytics.service";

export type OAuthProvider = "google" | "discord";

export class AuthService {
  public static listenToAuthState(
    onUserFound: (userId: string, accessToken: string) => void,
    onUserNotFound: () => void,
  ): () => void {
    const result = supabase.auth.onAuthStateChange((_event, session) => {
      AnalyticsService.setIdentity(session?.user.id ?? null);
      if (session) {
        onUserFound(session.user.id, session.access_token);
      } else {
        onUserNotFound();
      }
    });
    return () => result.data.subscription.unsubscribe();
  }
  public static async sendOTPCodeToEmail(email: string): Promise<void> {
    try {
      const result = await supabase.auth.signInWithOtp({
        email,
      });
      if (result.error) {
        throw result.error;
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
    // Send OTP code to email
  }
  public static async verifyOTPCode(
    email: string,
    otpCode: string,
  ): Promise<void> {
    // Verify OTP code
    try {
      const result = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email",
      });
      if (result.error) {
        throw result.error;
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   * Starts an OAuth sign in by redirecting the browser to the provider. The
   * provider sends the user back to the auth page on this origin, keeping the
   * in-app continuePath so they land where they were headed.
   */
  public static async signInWithOAuth(provider: OAuthProvider): Promise<void> {
    try {
      const result = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: buildOAuthRedirectUrl(
            window.location.origin,
            pathConfig.auth,
            window.location.search,
          ),
        },
      });
      if (result.error) {
        throw result.error;
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   * Resolves once supabase-js has finished checking the current URL for a
   * session or an auth redirect error, so callers can safely read and then
   * clean up the URL without racing the client's own detection.
   */
  public static async waitForInitialization(): Promise<void> {
    await supabase.auth.initialize();
  }

  public static async logout(): Promise<void> {
    try {
      const result = await supabase.auth.signOut();
      if (result.error) {
        console.error(result.error);
        throw result.error;
      }
      return;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
