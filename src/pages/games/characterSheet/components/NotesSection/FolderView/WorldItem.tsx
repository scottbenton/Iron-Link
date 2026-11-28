import { useState } from "react";
import { useTranslation } from "react-i18next";

import { NoteCard } from "ui/game/NoteCard";
import { GlobeIcon } from "ui/icons";

import { LinkWorldDialog } from "../WorldView/LinkWorldDialog";

// An invitation to link a world, rendered as the first tile in a Guide's root
// folder grid while the game has no world. A linked world gets its own
// section above the grid instead (GameWorldSection).
//
// Visibility lives in FolderView, which decides whether to reserve a grid slot.
export function WorldItem() {
  const { t } = useTranslation();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  return (
    <>
      <NoteCard
        icon={<GlobeIcon />}
        title={t("worlds.game.link-a-world", "Link a World")}
        link={{
          render: <button type="button" />,
          onClick: () => setLinkDialogOpen(true),
        }}
      />
      {/* Mounted only while open: the dialog loads the user's worlds on mount. */}
      {linkDialogOpen && (
        <LinkWorldDialog open onClose={() => setLinkDialogOpen(false)} />
      )}
    </>
  );
}
