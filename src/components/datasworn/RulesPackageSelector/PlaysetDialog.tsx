import { Dialog } from "@/components/common/Dialog";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { PlaysetConfig } from "@/repositories/game.repository";
import { Button } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";
import { Dispatch, SetStateAction } from "react";

import { PlaysetEditor } from "./PlaysetEditor";

export interface PlaysetDialogProps {
  playset: PlaysetConfig;
  setPlayset: Dispatch<SetStateAction<PlaysetConfig>>;
  rulesets: Record<string, Datasworn.Ruleset>;
  expansions: Record<string, Datasworn.Expansion>;
}

export function PlaysetDialog(props: PlaysetDialogProps) {
  const { playset, setPlayset, rulesets, expansions } = props;
  const t = useDataswornTranslations();

  return (
    <Dialog
      trigger={
        <Button mt={2} variant="outline" colorPalette="gray">
          {t("playset.edit-button", "Edit Playset")}
        </Button>
      }
      title={t("playsets.edit-playset-title", "Edit Playset")}
      fullContent={
        <PlaysetEditor
          playset={playset}
          setPlayset={setPlayset}
          rulesets={rulesets}
          expansions={expansions}
        />
      }
    />
  );
}
