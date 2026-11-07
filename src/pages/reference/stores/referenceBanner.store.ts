import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const referenceBannerLocalStorageKey =
  "iron-link-reference-banner-dismissed";

// Whether this device has dismissed the reference page's invitation to keep a
// character in Iron Link. Per device, never synced, so no account is needed.
export const useReferenceBanner = create<{
  dismissed: boolean;
  dismiss: () => void;
}>()(
  persist(
    (set) => ({
      dismissed: false,
      dismiss: () => set({ dismissed: true }),
    }),
    {
      name: referenceBannerLocalStorageKey,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
