import { TFunction } from "i18next";

export function getItemName(params: {
  name: string | undefined;
  isRootPlayerFolder: boolean;
  t: TFunction;
}): string {
  const { name, t, isRootPlayerFolder } = params;

  if (isRootPlayerFolder) {
    return t("notes.user-folder", "Notes");
  }

  return name ?? t("notes.default-folder-name", "Folder");
}
