import { Datasworn } from "@datasworn/core";
import { Dialog } from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { PlaysetConfig } from "repositories/game.repository";

import { PlaysetEditor } from "./PlaysetEditor";

export interface PlaysetDialogProps {
  open: boolean;
  onClose: () => void;
  playset: PlaysetConfig;
  setPlayset: Dispatch<SetStateAction<PlaysetConfig>>;
  rulesets: Record<string, Datasworn.Ruleset>;
  expansions: Record<string, Datasworn.Expansion>;
}

export function PlaysetDialog(props: PlaysetDialogProps) {
  const { open, onClose, playset, setPlayset, rulesets, expansions } = props;
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("game.playsets.edit-playset-title", "Edit Playset")}
      </DialogTitleWithCloseButton>
      <PlaysetEditor
        playset={playset}
        setPlayset={setPlayset}
        rulesets={rulesets}
        expansions={expansions}
        onClose={onClose}
      />
    </Dialog>
  );
}
