import type { Datasworn } from "@datasworn-community/core";
import CasinoIcon from "@mui/icons-material/Casino";
import CheckIcon from "@mui/icons-material/Check";
import { Box, Button, Typography } from "@mui/material";
import { useEffect, useId, useRef, useState } from "react";
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
import { WorldTruthSummaryCard } from "./WorldTruthSummaryCard";
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

// One truth. Players, and Guides once it is chosen, read it as a summary card
// in the truths grid; a Guide choosing it sees every option across the whole
// row.
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
  // A chosen truth opens as its summary, and stays open after a choice until
  // Done, so a sub-table row can still be picked.
  const [showOptions, setShowOptions] = useState(!resolved);
  const expanded = canEdit && (!resolved || showOptions);
  // Change and Done are different buttons in different places, so the one
  // that appears takes focus from the one that went.
  const changeRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    (expanded ? doneRef : changeRef).current?.focus();
  }, [expanded]);
  const toggle = (show: boolean) => {
    moveFocus.current = true;
    setShowOptions(show);
  };
  // Sundered Isles asks each truth's question in its summary.
  const question = (truth as { summary?: string }).summary;

  const dialog = writing && (
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
  );

  if (!expanded)
    return (
      <WorldTruthSummaryCard
        number={number}
        truth={truth}
        resolved={resolved}
        questStarter={questStarter}
        headingId={headingId}
        headingComponent={Heading}
        onChange={canEdit ? () => toggle(true) : undefined}
        changeButtonRef={changeRef}
        controlsId={optionsId}
      />
    );

  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      sx={{ gridColumn: "1 / -1" }}
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
        {resolved && (
          <Button
            ref={doneRef}
            color="inherit"
            variant="outlined"
            startIcon={<CheckIcon />}
            aria-expanded
            aria-controls={optionsId}
            onClick={() => toggle(false)}
          >
            {t("worlds.truths.done", "Done")}
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
      {truth.your_character && (
        <Box sx={{ color: "text.secondary", mb: 2 }}>
          <MarkdownRenderer
            markdown={truth.your_character}
            typographyVariant="body2"
            inheritColor
          />
        </Box>
      )}
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
      {dialog}
    </Box>
  );
}
