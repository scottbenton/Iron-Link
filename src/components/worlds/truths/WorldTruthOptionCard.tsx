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

// Datasworn embeds the sub-table in the description; the card lists it below.
function withoutTableEmbeds(markdown: string) {
  return markdown.replace(/\n*\{\{table>[^}]+\}\}\n*/g, "\n\n").trim();
}

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
// card's main button. The sub-table and quest starter can't sit inside a
// button, so until the option is chosen the button stretches over the whole
// card; once chosen it stops, and the sub-table's radios take clicks.
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
        markdown={withoutTableEmbeds(option.description)}
        typographyVariant="body2"
        disableLinks={canEdit && !selected}
      />
    </>
  );

  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        position: "relative",
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
            // Static, so its hover highlight, ripple and stretched hit area
            // all fill the card rather than the text alone.
            position: "static",
            "&::before": selected
              ? undefined
              : { content: '""', position: "absolute", inset: 0, zIndex: 1 },
            p: 2,
            pb: subTable || canEdit ? 1 : 2,
            // A button centres its content; keep the text at the top when
            // the card stretches to its row's height.
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "flex-start",
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
        <Box
          sx={{
            px: 2,
            pb: canEdit ? 0 : 2,
            flexGrow: 1,
            // Above the stretched button once chosen, so the radios work.
            position: "relative",
            zIndex: selected ? 2 : 0,
          }}
        >
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
        <Box
          sx={{
            px: 2,
            pb: 2,
            mt: "auto",
            position: "relative",
            zIndex: selected ? 2 : 0,
          }}
        >
          <WorldTruthQuestStarter
            markdown={option.quest_starter}
            disableLinks={!selected}
          />
        </Box>
      )}
    </Card>
  );
}
