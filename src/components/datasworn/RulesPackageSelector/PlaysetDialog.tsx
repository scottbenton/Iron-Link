import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeader,
} from "ui/components/Dialog";

import { IExpansionConfig, IRulesetConfig } from "data/package.config";

import { PlaysetConfig } from "repositories/game.repository";

import { PlaysetEditor } from "./PlaysetEditor";
import { applyPlaysetDraft, usePlaysetDraft } from "./usePlaysetDraft";

export interface PlaysetDialogProps {
  open: boolean;
  onClose: () => void;
  playset: PlaysetConfig;
  setPlayset: Dispatch<SetStateAction<PlaysetConfig>>;
  rulesets: Record<string, IRulesetConfig>;
  expansions: Record<string, IExpansionConfig>;
}

/** Choose which assets, moves and oracles of the chosen packages a game uses. */
export function PlaysetDialog(props: PlaysetDialogProps) {
  const { open, onClose, playset, setPlayset, rulesets, expansions } = props;
  const { t } = useTranslation();

  const { draft, setExcluded, setAutoRollCursedDie } = usePlaysetDraft(
    playset,
    open,
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="md"
      fullScreenOnMobile
      onSubmit={() => {
        setPlayset(applyPlaysetDraft(playset, draft));
        onClose();
      }}
    >
      <DialogHeader
        title={t("game.playsets.edit-playset-title", "Edit Playset")}
      />
      <DialogBody>
        {open && (
          <PlaysetEditor
            rulesets={rulesets}
            expansions={expansions}
            draft={draft}
            setExcluded={setExcluded}
            setAutoRollCursedDie={setAutoRollCursedDie}
          />
        )}
      </DialogBody>
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button variant="primary" type="submit">
          {t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
