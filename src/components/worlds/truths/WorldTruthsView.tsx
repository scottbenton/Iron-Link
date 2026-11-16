import { Alert, LinearProgress, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

import { useWorldTruthQuestStarters } from "stores/worldTruths.store";

import { WorldTruthSection } from "./WorldTruthSection";
import { useWorldTruthActions } from "./useWorldTruthActions";
import { useWorldTruthsSummary } from "./useWorldTruthsSummary";

// The world's truths, one numbered section per truth of its setting. Guides
// choose, roll or write each one; players read only what was chosen.
export function WorldTruthsView({
  worldId,
  settingKey,
  canEdit,
}: {
  worldId: string;
  settingKey: string | null;
  canEdit: boolean;
}) {
  const { t } = useTranslation();
  const { truths, choices, loading, error } = useWorldTruthsSummary(
    worldId,
    settingKey,
  );
  const questStarters = useWorldTruthQuestStarters(worldId);
  const actions = useWorldTruthActions(worldId);

  if (error)
    return (
      <Alert severity="error">
        {t(
          "worlds.truths.load-error",
          "This world's truths could not be loaded.",
        )}
      </Alert>
    );
  if (loading || !truths) return <LinearProgress />;
  if (!truths.length)
    return (
      <EmptyState
        message={t(
          "worlds.truths.none",
          "This world's setting has no truths. Choose a setting in World settings to use its truths.",
        )}
        sx={{ py: 4 }}
      />
    );

  return (
    <Stack spacing={5} sx={{ pb: 4 }}>
      {truths.map((truth, index) => (
        <WorldTruthSection
          key={truth._id}
          number={index + 1}
          truth={truth}
          choice={choices[truth._id]}
          questStarter={canEdit ? questStarters[truth._id] : undefined}
          canEdit={canEdit}
          actions={actions}
        />
      ))}
    </Stack>
  );
}
