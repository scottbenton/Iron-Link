import { Tables, TablesUpdate } from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import {
  ErrorNoun,
  ErrorVerb,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export type UserDTO = Omit<
  Tables<"users">,
  "created_at" | "accessibility_settings"
>;
type UpdateUserDTO = TablesUpdate<"users">;

export class UserRepository {
  private static users = () => supabase.from("users");

  public static async getUser(userId: string): Promise<UserDTO> {
    return new Promise<UserDTO>((resolve, reject) => {
      this.users()
        .select("id, display_name")
        .eq("id", userId)
        .single()
        .then((response) => {
          if (response.error) {
            console.error(response.error);
            reject(
              getRepositoryError(
                response.error,
                ErrorVerb.Read,
                ErrorNoun.User,
                false,
                response.status,
              ),
            );
          } else {
            resolve(response.data);
          }
        });
    });
  }

  public static async updateUser(
    uid: string,
    user: UpdateUserDTO,
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.users()
        .update(user)
        .eq("id", uid)
        .select()
        .single()
        .then((response) => {
          if (response.error) {
            console.error(response.error);
            reject(
              getRepositoryError(
                response.error,
                ErrorVerb.Update,
                ErrorNoun.User,
                false,
                response.status,
              ),
            );
          } else {
            resolve(response.data.display_name);
          }
        });
    });
  }
}
