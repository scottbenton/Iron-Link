import CasinoIcon from "@mui/icons-material/Casino";
import { Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { resolveWorldTruthChoice } from "lib/worldTruths.lib";

import { useWorldTruthActions } from "./useWorldTruthActions";
import { useWorldTruthsSummary } from "./useWorldTruthsSummary";

// How many of the setting's truths are chosen, for the truths strip.
export function WorldTruthsCount({
  worldId,
  settingKey,
}: {
  worldId: string;
  settingKey: string | null;
}) {
  const { t } = useTranslation();
  const { chosen, total, loading } = useWorldTruthsSummary(worldId, settingKey);
  if (loading || !total) return null;
  return (
    <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
      {t("worlds.truths.chosen-count", "{{chosen}} of {{total}} chosen", {
        chosen,
        total,
      })}
    </Typography>
  );
}

// Rolls every truth that has no choice yet, and leaves chosen ones alone.
export function WorldTruthsRollUnchosenButton({
  worldId,
  settingKey,
}: {
  worldId: string;
  settingKey: string | null;
}) {
  const { t } = useTranslation();
  const { truths, choices } = useWorldTruthsSummary(worldId, settingKey);
  const { rollUnchosen } = useWorldTruthActions(worldId);
  const unchosen = (truths ?? []).filter(
    (truth) => !resolveWorldTruthChoice(truth, choices[truth._id]),
  );
  if (!truths?.length) return null;
  return (
    <Button
      variant="contained"
      startIcon={<CasinoIcon />}
      disabled={!unchosen.length}
      onClick={() => rollUnchosen(unchosen)}
    >
      {t("worlds.truths.roll-unchosen", "Roll unchosen truths")}
    </Button>
  );
}
