import { Alert, Box, LinearProgress } from "@mui/material";
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
    // Truth summaries sit side by side, as many to a row as fit at 40
    // characters or more, each as tall as its row.
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 40ch), 1fr))",
        columnGap: 3,
        rowGap: 5,
        pb: 4,
      }}
    >
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
    </Box>
  );
}
