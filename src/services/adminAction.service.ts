import { supabase } from "lib/supabase.lib";

import { AdminActionsRepository } from "repositories/adminActions.repository";
import {
  ErrorNoun,
  ErrorVerb,
  getRepositoryError,
} from "repositories/errors/RepositoryErrors";

export class AdminActionService {
  public static async checkIfUserIsAdmin(userId: string) {
    return AdminActionsRepository.checkIfUserIsAdmin(userId);
  }

  public static async getMagicLinkFromUIDOrEmail(
    uid: string | undefined,
    email: string | undefined,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      supabase.functions
        .invoke("get-admin-magic-link", {
          body: { uid, email },
        })
        .then(({ error, data }) => {
          if (error || !data.actionLink) {
            console.error(error);
            reject(
              getRepositoryError(error, ErrorVerb.Read, ErrorNoun.User, false),
            );
          } else {
            resolve(data.actionLink);
          }
        });
    });
  }
}
