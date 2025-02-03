import { Accordion, AccordionDetails, Box } from "@mui/material";
import { useTranslation } from "react-i18next";

import { MarkdownRenderer } from "components/MarkdownRenderer";

import { useMove } from "hooks/datasworn/useMove";

import { getRollResultLabel } from "data/rollResultLabel";

import {
  ISpecialTrackProgressRoll,
  ITrackProgressRoll,
} from "services/gameLog.service";

import { AccordionTitle } from "./AccordionTitle";
import { RollResult } from "./RollResult";
import { RollResultIcons } from "./RollResultIcons";
import { RollValues } from "./RollValues";
import { getMoveOutcome } from "./getMoveOutcome";

interface TrackProgressRollAccordionProps {
  roll: ITrackProgressRoll | ISpecialTrackProgressRoll;
}

export function TrackProgressRollAccordion(
  props: TrackProgressRollAccordionProps,
) {
  const { roll } = props;
  const { t } = useTranslation();

  const move = useMove(roll.moveId);
  const moveOutcome = getMoveOutcome(move, roll.result);

  const trackName = roll.rollLabel;

  const resultLabel = getRollResultLabel(roll.result);
  return (
    <Accordion variant="outlined">
      <AccordionTitle
        id={roll.id}
        uid={roll.uid}
        characterId={roll.characterId}
        title={move?.name ? `${move.name}: ${trackName}` : `${trackName}`}
        titleSecondaryContent={<RollResultIcons result={roll.result} />}
      />
      <AccordionDetails
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <RollValues
          progress={roll.trackProgress}
          d10Results={[roll.challenge1, roll.challenge2]}
        />
        <RollResult
          result={resultLabel}
          extras={[
            ...(roll.challenge1 === roll.challenge2
              ? [t("datasworn.match", "Match")]
              : []),
          ]}
        />
        {moveOutcome && (
          <Box bgcolor="background.default" px={1} borderRadius={1}>
            <MarkdownRenderer markdown={moveOutcome.text} inheritColor />
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
