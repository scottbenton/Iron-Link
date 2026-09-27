import type { IconType } from "react-icons";

let iconsPromise: Promise<Record<string, IconType>> | undefined;
export function loadCategoryIcons() {
  iconsPromise ??= import("react-icons/gi").then(
    (icons) =>
      Object.fromEntries(
        Object.entries(icons).filter(([key]) => key.startsWith("Gi")),
      ) as Record<string, IconType>,
  );
  return iconsPromise;
}

export function categoryIconName(key: string) {
  return key.replace(/^Gi/, "").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}
