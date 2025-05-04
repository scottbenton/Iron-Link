import { supabase } from "lib/supabase.lib";

export class AdminActionsRepository {
  private static admins = () => supabase.from("admins");

  public static async checkIfUserIsAdmin(userId: string) {
    const { data, error } = await this.admins()
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return data !== null;
  }
}
