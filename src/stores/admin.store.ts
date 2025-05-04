import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { AdminActionService } from "services/adminAction.service";

import { useUID } from "./auth.store";

export interface IAdminState {
  isAdmin: boolean;
  isLoading: boolean;
}

export interface IAdminActions {
  checkIfUserIsAdmin: (userId: string) => void;
  getMagicLink: (
    uid: string | undefined,
    email: string | undefined,
  ) => Promise<string>;
}

export const useAdminStore = createWithEqualityFn<
  IAdminState & IAdminActions
>()(
  immer((set) => ({
    isAdmin: false,
    isLoading: true,

    checkIfUserIsAdmin: (userId) => {
      AdminActionService.checkIfUserIsAdmin(userId)
        .then((isAdmin) => {
          set({ isAdmin, isLoading: false });
        })
        .catch((error) => {
          console.error("Error checking admin status:", error);
          set({ isAdmin: false, isLoading: false });
        });
    },

    getMagicLink: async (uid, email) => {
      set({ isLoading: true });
      try {
        const link = await AdminActionService.getMagicLinkFromUIDOrEmail(
          uid,
          email,
        );
        return link;
      } catch (error) {
        console.error("Error getting magic link:", error);
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },
  })),
  deepEqual,
);

export function useCheckAdminStatus() {
  const checkIfUserIsAdmin = useAdminStore((store) => store.checkIfUserIsAdmin);
  const uid = useUID();

  useEffect(() => {
    if (uid) {
      checkIfUserIsAdmin(uid);
    }
  }, [uid, checkIfUserIsAdmin]);
}
