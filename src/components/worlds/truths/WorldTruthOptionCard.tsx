import type { Datasworn } from "@datasworn-community/core";
import CasinoIcon from "@mui/icons-material/Casino";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Box,
  Card,
  CardActionArea,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { MarkdownRenderer } from "components/MarkdownRenderer";

import { getTruthOptionSubTable } from "lib/worldTruths.lib";

import { WorldTruthQuestStarter } from "./WorldTruthQuestStarter";
import { formatTruthRange } from "./worldTruthLabels";

export interface WorldTruthOptionCardProps {
  option: Datasworn.TruthOption;
  selected: boolean;
  selectedSubOptionId?: string | null;
  // Guides choose options and sub-table rows and see quest starters.
  canEdit: boolean;
  onSelect?: () => void;
  onSelectSubOption?: (subOptionId: string) => void;
  onRollSubOption?: () => void;
}

// One option of a truth: its d100 range, summary and description, a
// Starforged sub-table, and for Guides the quest starter. Choosing is the
// card's main button; the sub-table sits outside it, active only on the
// chosen card.
export function WorldTruthOptionCard(props: WorldTruthOptionCardProps) {
  const {
    option,
    selected,
    selectedSubOptionId,
    canEdit,
    onSelect,
    onSelectSubOption,
    onRollSubOption,
  } = props;
  const { t } = useTranslation();
  const subTable = getTruthOptionSubTable(option);
  const subTableLabelId = useId();
  const range = formatTruthRange(option.roll);

  const body = (
    <>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          component="span"
          sx={{ flexGrow: 1, lineHeight: 2 }}
        >
          {range}
        </Typography>
        {selected && (
          <CheckCircleIcon
            color="primary"
            titleAccess={t("worlds.truths.chosen", "Chosen")}
          />
        )}
      </Box>
      {option.summary && (
        <MarkdownRenderer
          markdown={option.summary}
          typographyVariant="body1"
          sx={{ fontWeight: 600 }}
        />
      )}
      <MarkdownRenderer
        markdown={option.description}
        typographyVariant="body2"
        disableLinks={canEdit && !selected}
      />
    </>
  );

  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderColor: selected ? theme.palette.primary.main : undefined,
        boxShadow: selected
          ? `inset 0 0 0 1px ${theme.palette.primary.main}`
          : undefined,
      })}
    >
      {canEdit && onSelect ? (
        <CardActionArea
          aria-pressed={selected}
          onClick={selected ? undefined : onSelect}
          sx={{
            p: 2,
            pb: subTable || canEdit ? 1 : 2,
            display: "block",
            textAlign: "left",
            flexGrow: subTable ? 0 : 1,
          }}
        >
          {body}
        </CardActionArea>
      ) : (
        <Box sx={{ p: 2, pb: subTable ? 1 : 2 }}>{body}</Box>
      )}
      {subTable && (
        <Box sx={{ px: 2, pb: canEdit ? 0 : 2, flexGrow: 1 }}>
          {canEdit ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  id={subTableLabelId}
                  variant="subtitle2"
                  sx={{ flexGrow: 1 }}
                >
                  {subTable.name}
                </Typography>
                <Tooltip
                  title={t("worlds.truths.roll-named", "Roll {{name}}", {
                    name: subTable.name,
                  })}
                >
                  <span>
                    <IconButton
                      size="small"
                      disabled={!selected}
                      onClick={onRollSubOption}
                      aria-label={t(
                        "worlds.truths.roll-named",
                        "Roll {{name}}",
                        {
                          name: subTable.name,
                        },
                      )}
                    >
                      <CasinoIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              <RadioGroup
                aria-labelledby={subTableLabelId}
                value={selected ? (selectedSubOptionId ?? "") : ""}
                onChange={(_, value) => onSelectSubOption?.(value)}
              >
                {subTable.rows.map((row) => (
                  <FormControlLabel
                    key={row._id}
                    value={row._id}
                    disabled={!selected}
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2">
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ mr: 1 }}
                        >
                          {formatTruthRange(row.roll)}
                        </Typography>
                        {row.text}
                      </Typography>
                    }
                  />
                ))}
              </RadioGroup>
            </>
          ) : (
            selectedSubOptionId && (
              <Typography variant="body2">
                <Typography component="span" variant="subtitle2" sx={{ mr: 1 }}>
                  {subTable.name}:
                </Typography>
                {
                  subTable.rows.find((row) => row._id === selectedSubOptionId)
                    ?.text
                }
              </Typography>
            )
          )}
        </Box>
      )}
      {canEdit && (
        <Box sx={{ px: 2, pb: 2, mt: "auto" }}>
          <WorldTruthQuestStarter markdown={option.quest_starter} />
        </Box>
      )}
    </Card>
  );
}
