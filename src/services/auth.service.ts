import { supabase } from "lib/supabase.lib";

export class AuthService {
  public static listenToAuthState(
    onUserFound: (userId: string) => void,
    onUserNotFound: () => void
  ): () => void {
    const result = supabase.auth.onAuthStateChange((_event, session) => { 
      if (session) {
        onUserFound(session.user.id);
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
