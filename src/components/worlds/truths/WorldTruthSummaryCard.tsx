import type { Datasworn } from "@datasworn-community/core";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Button, Card, Typography } from "@mui/material";
import type { ElementType, Ref } from "react";
import { useTranslation } from "react-i18next";

import { MarkdownRenderer } from "components/MarkdownRenderer";

import {
  type ResolvedWorldTruth,
  getTruthOptionSubTable,
} from "lib/worldTruths.lib";

import { WorldTruthQuestStarter } from "./WorldTruthQuestStarter";
import { withoutTableEmbeds, withoutTableLeadIns } from "./worldTruthLabels";

// A truth read as its choice alone, in one self-contained card: the truth's
// name, what was chosen and, for Guides, its quest starter at the foot and a
// Change button that shows every option again.
export function WorldTruthSummaryCard({
  number,
  truth,
  resolved,
  questStarter,
  headingId,
  headingComponent,
  onChange,
  changeButtonRef,
  controlsId,
}: {
  number: number;
  truth: Datasworn.Truth;
  resolved: ResolvedWorldTruth | undefined;
  // Guides only: the written truth's quest starter. A chosen option's comes
  // from the rules.
  questStarter?: string;
  headingId: string;
  headingComponent: ElementType;
  onChange?: () => void;
  changeButtonRef?: Ref<HTMLButtonElement>;
  controlsId?: string;
}) {
  const { t } = useTranslation();
  const subTable =
    resolved?.kind === "option"
      ? getTruthOptionSubTable(resolved.option)
      : undefined;
  const shownQuestStarter = onChange
    ? resolved?.kind === "option"
      ? resolved.option.quest_starter
      : questStarter
    : undefined;

  return (
    <Card
      component="section"
      aria-labelledby={headingId}
      variant="outlined"
      sx={{ height: "100%", p: 2, display: "flex", flexDirection: "column" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Typography
          id={headingId}
          component={headingComponent}
          variant="h6"
          sx={(theme) => ({
            flexGrow: 1,
            fontFamily: theme.typography.fontFamilyTitle,
            m: 0,
          })}
        >
          {`${number}. ${truth.name}`}
        </Typography>
        {onChange && (
          <Button
            ref={changeButtonRef}
            color="inherit"
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            aria-expanded={false}
            aria-controls={controlsId}
            onClick={onChange}
          >
            {t("worlds.truths.change", "Change")}
          </Button>
        )}
      </Box>
      {resolved?.kind === "option" ? (
        <>
          {resolved.option.summary && (
            <MarkdownRenderer
              markdown={resolved.option.summary}
              typographyVariant="body1"
              sx={{ fontWeight: 600 }}
            />
          )}
          <MarkdownRenderer
            markdown={withoutTableEmbeds(
              // With no row chosen, a lead-in to the sub-table leads nowhere.
              subTable && !resolved.subRow
                ? withoutTableLeadIns(resolved.option.description)
                : resolved.option.description,
            )}
            typographyVariant="body2"
          />
          {subTable && resolved.subRow && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <Typography component="span" variant="subtitle2" sx={{ mr: 1 }}>
                {subTable.name}:
              </Typography>
              {resolved.subRow.text}
            </Typography>
          )}
        </>
      ) : resolved?.kind === "custom" ? (
        <MarkdownRenderer
          markdown={resolved.description}
          typographyVariant="body2"
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t("worlds.truths.not-chosen", "Not chosen yet.")}
        </Typography>
      )}
      {shownQuestStarter && (
        <Box sx={{ mt: "auto" }}>
          <WorldTruthQuestStarter markdown={shownQuestStarter} />
        </Box>
      )}
    </Card>
  );
}
