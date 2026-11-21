import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Button, Card, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { RulesText } from "ui/game/RulesText";

import { WorldTruthQuestStarter } from "./WorldTruthQuestStarter";

// The last card of a Guide's truth: Write your own truth, or the written
// truth itself once chosen.
export function WorldCustomTruthCard({
  selected,
  description,
  questStarter,
  onWrite,
}: {
  selected: boolean;
  description?: string;
  questStarter?: string;
  onWrite: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        height: "100%",
        p: 2,
        display: "flex",
        flexDirection: "column",
        borderStyle: selected ? "solid" : "dashed",
        borderColor: selected ? theme.palette.primary.main : undefined,
        boxShadow: selected
          ? `inset 0 0 0 1px ${theme.palette.primary.main}`
          : undefined,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          component="span"
          sx={{ flexGrow: 1, lineHeight: 2 }}
        >
          {t("worlds.truths.your-own", "Your own truth")}
        </Typography>
        {selected && (
          <CheckCircleIcon
            color="primary"
            titleAccess={t("worlds.truths.chosen", "Chosen")}
          />
        )}
      </Box>
      {selected && description !== undefined ? (
        <>
          <RulesText markdown={description} size="sm" />
          {questStarter && <WorldTruthQuestStarter markdown={questStarter} />}
          <Box sx={{ mt: 2 }}>
            <Button
              color="inherit"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={onWrite}
            >
              {t("common.edit", "Edit")}
            </Button>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 2,
          }}
        >
          <Button color="inherit" variant="outlined" onClick={onWrite}>
            {t("worlds.truths.write", "Write your own truth")}
          </Button>
        </Box>
      )}
    </Card>
  );
}
