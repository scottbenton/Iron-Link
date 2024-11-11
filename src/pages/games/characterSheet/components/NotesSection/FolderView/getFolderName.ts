import { TFunction } from "i18next";

import { FAKE_ROOT_NOTE_FOLDER_KEY } from "./rootNodeName";
import { GUIDE_NOTE_FOLDER_NAME } from "api-calls/notes/_getRef";

export function getItemName(params: {
  name: string;
  id: string;
  uid: string;
  t: TFunction;
}): string {
  const { name, id, uid, t } = params;

  if (id === uid) {
    return t("notes.user-folder", "Your Notes");
  } else if (id === GUIDE_NOTE_FOLDER_NAME) {
    return t("notes.guide-folder", "Guide Notes");
  } else if (id === FAKE_ROOT_NOTE_FOLDER_KEY) {
    return t("notes.root-folder", "Notes");
  }

  return name;
}
