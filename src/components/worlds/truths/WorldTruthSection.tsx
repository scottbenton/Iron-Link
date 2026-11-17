import type { Datasworn } from "@datasworn-community/core";
import CasinoIcon from "@mui/icons-material/Casino";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import { Box, Button, Card, Typography } from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { useHeadingComponent } from "components/HeadingLevel";
import { MarkdownRenderer } from "components/MarkdownRenderer";

import {
  type WorldTruthChoice,
  resolveWorldTruthChoice,
} from "lib/worldTruths.lib";

import { WorldCustomTruthCard } from "./WorldCustomTruthCard";
import { WorldCustomTruthDialog } from "./WorldCustomTruthDialog";
import { WorldTruthOptionCard } from "./WorldTruthOptionCard";
import type { useWorldTruthActions } from "./useWorldTruthActions";

// Options sit three to a row where the pane has room, one on a phone.
const optionGridSx = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: "minmax(0, 1fr)",
  "@container world-configuration (min-width: 640px)": {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  "@container world-configuration (min-width: 960px)": {
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  },
} as const;

export function WorldTruthSection({
  number,
  truth,
  choice,
  questStarter,
  canEdit,
  actions,
}: {
  number: number;
  truth: Datasworn.Truth;
  choice: WorldTruthChoice | undefined;
  questStarter: string | undefined;
  canEdit: boolean;
  actions: ReturnType<typeof useWorldTruthActions>;
}) {
  const { t } = useTranslation();
  const headingId = useId();
  const Heading = useHeadingComponent(2);
  const optionsId = useId();
  const [writing, setWriting] = useState(false);
  const resolved = resolveWorldTruthChoice(truth, choice);
  // A chosen truth opens condensed to its choice, and stays open after a
  // choice until Done, so a sub-table row can still be picked.
  const [showOptions, setShowOptions] = useState(!resolved);
  const condensed = canEdit && !!resolved && !showOptions;
  // Sundered Isles asks each truth's question in its summary.
  const question = (truth as { summary?: string }).summary;

  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      // A truth showing only its choice takes one cell of the truths grid, at
      // most 65 characters wide; one showing every option takes the whole row.
      sx={
        canEdit && !condensed ? { gridColumn: "1 / -1" } : { maxWidth: "65ch" }
      }
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Typography
          id={headingId}
          component={Heading}
          variant="h5"
          sx={(theme) => ({
            flexGrow: 1,
            fontFamily: theme.typography.fontFamilyTitle,
            m: 0,
          })}
        >
          {`${number}. ${truth.name}`}
        </Typography>
        {canEdit && !condensed && (
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<CasinoIcon />}
            onClick={() => actions.roll(truth)}
            aria-label={t("worlds.truths.roll-named", "Roll {{name}}", {
              name: truth.name,
            })}
          >
            {t("worlds.truths.roll", "Roll")}
          </Button>
        )}
        {canEdit && resolved && (
          // One button that changes its label, so focus stays on it.
          <Button
            color="inherit"
            variant="outlined"
            startIcon={condensed ? <EditIcon /> : <CheckIcon />}
            aria-expanded={!condensed}
            aria-controls={optionsId}
            onClick={() => setShowOptions((show) => !show)}
          >
            {condensed
              ? t("worlds.truths.change", "Change")
              : t("worlds.truths.done", "Done")}
          </Button>
        )}
      </Box>
      {question && (
        <MarkdownRenderer
          markdown={question}
          typographyVariant="body1"
          sx={{ fontWeight: 600 }}
        />
      )}
      {truth.your_character && !condensed && (
        <Box sx={{ color: "text.secondary", mb: 2 }}>
          <MarkdownRenderer
            markdown={truth.your_character}
            typographyVariant="body2"
            inheritColor
          />
        </Box>
      )}
      {condensed ? (
        <Box id={optionsId} sx={{ mt: question ? 2 : 0 }}>
          {resolved.kind === "option" ? (
            <WorldTruthOptionCard
              option={resolved.option}
              selected={false}
              selectedSubOptionId={resolved.subRow?._id}
              canEdit={false}
              showQuestStarter
            />
          ) : (
            <WorldCustomTruthCard
              selected
              description={resolved.description}
              questStarter={questStarter}
              onWrite={() => setWriting(true)}
            />
          )}
        </Box>
      ) : canEdit ? (
        <Box id={optionsId} sx={optionGridSx}>
          {truth.options.map((option) => {
            const selected =
              resolved?.kind === "option" && resolved.option._id === option._id;
            return (
              <WorldTruthOptionCard
                key={option._id}
                option={option}
                selected={selected}
                selectedSubOptionId={selected ? choice?.subOptionId : null}
                canEdit
                onSelect={() => actions.choose(truth._id, option._id, null)}
                onSelectSubOption={(subOptionId) =>
                  actions.choose(truth._id, option._id, subOptionId)
                }
                onRollSubOption={() => actions.rollSubOption(truth, option)}
              />
            );
          })}
          <WorldCustomTruthCard
            selected={resolved?.kind === "custom"}
            description={
              resolved?.kind === "custom" ? resolved.description : undefined
            }
            questStarter={questStarter}
            onWrite={() => setWriting(true)}
          />
        </Box>
      ) : resolved?.kind === "option" ? (
        <WorldTruthOptionCard
          option={resolved.option}
          selected={false}
          selectedSubOptionId={resolved.subRow?._id}
          canEdit={false}
        />
      ) : resolved?.kind === "custom" ? (
        <Card variant="outlined" sx={{ p: 2 }}>
          <MarkdownRenderer
            markdown={resolved.description}
            typographyVariant="body2"
          />
        </Card>
      ) : (
        <Typography color="text.secondary">
          {t("worlds.truths.not-chosen", "Not chosen yet.")}
        </Typography>
      )}
      {writing && (
        <WorldCustomTruthDialog
          truthName={truth.name}
          initialDescription={
            resolved?.kind === "custom" ? resolved.description : ""
          }
          initialQuestStarter={
            resolved?.kind === "custom" ? (questStarter ?? "") : ""
          }
          onClose={() => setWriting(false)}
          onSave={(description, quest) =>
            actions.writeOwn(truth._id, description, quest)
          }
        />
      )}
    </Box>
  );
}
