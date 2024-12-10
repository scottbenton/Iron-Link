import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";

import { UserService } from "services/user.service";

interface UserStoreState {
  users: Record<
    string,
    | {
        loading: boolean;
        user?: {
          name: string;
        };
      }
    | undefined
  >;
}

interface UserStoreActions {
  loadUserDetails: (uid: string) => void;
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
  })),
  shallow,
);

export function useLoadUserDetails(uid: string) {
  const loadUserDetails = useUsersStore((state) => state.loadUserDetails);

  useEffect(() => {
    loadUserDetails(uid);
  }, [uid, loadUserDetails]);
}

export function useUserName(uid: string) {
  const { t } = useTranslation();

  useLoadUserDetails(uid);

  return useUsersStore((store) => {
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