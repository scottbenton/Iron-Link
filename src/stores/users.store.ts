import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";
import { UserService } from "@/services/user.service";

interface UserStoreState {
  users: Record<
    string,
    | {
      loading: boolean;
      user?: {
        name: string | null;
      };
    }
    | undefined
  >;
}

interface UserStoreActions {
  loadUserDetails: (uid: string) => void;
  setUserName: (uid: string, name: string) => Promise<void>;
}

export const useUsersStore = createWithEqualityFn<
  UserStoreState & UserStoreActions
>()(
  immer((set, getState) => ({
    users: {},
    loadUserDetails: (uid) => {
      const users = getState().users;
      if (!users[uid]) {
        set((state) => {
          state.users[uid] = { loading: true };
        });
        UserService.getUser(uid)
          .then((user) => {
            set((state) => {
              state.users[uid] = {
                loading: false,
                user: { name: user.displayName },
              };
            });
          })
          .catch(() => {
            set((state) => {
              state.users[uid] = { loading: false };
            });
          });
      }
    },
    setUserName: (uid, name) => {
      return new Promise((resolve, reject) => {
        UserService.setUserName(uid, name)
          .then((newName) => {
            set((state) => {
              state.users[uid] = {
                loading: false,
                user: { name: newName },
              };
            });
            resolve();
          })
          .catch(reject);
      });
    },
  })),
  deepEqual,
);

export function useLoadUserDetails(uid: string | null) {
  const loadUserDetails = useUsersStore((state) => state.loadUserDetails);

  useEffect(() => {
    if (uid) {
      loadUserDetails(uid);
    }
  }, [uid, loadUserDetails]);
}

export function useUserName(uid: string | null) {
  const { t } = useTranslation();

  useLoadUserDetails(uid);

  return useUsersStore((store) => {
    if (!uid) {
      return t("common.deleted-user", "Deleted User");
    }
    const user = store.users[uid];

    if (!user || user.loading) {
      return t("common.loading", "Loading");
    } else if (!user.user?.name) {
      return t("common.unknown", "Unknown");
    } else {
      return user.user.name;
    }
  });
}

export function useUserNameWithStatus(uid: string | null): {
  loading: boolean;
  name: string | null;
} {
  useLoadUserDetails(uid);

  return useUsersStore((store) => {
    if (!uid) {
      return {
        name: null,
        loading: false,
      };
    }
    const user = store.users[uid];

    if (!user || user.loading) {
      return {
        name: null,
        loading: true,
      };
    } else if (!user.user?.name) {
      return {
        name: null,
        loading: false,
      };
    } else {
      return {
        name: user.user.name,
        loading: false,
      };
    }
  });
}
