import {
  Accordion,
  AccordionDetails,
  Box,
  Link,
  capitalize,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { MarkdownRenderer } from "components/MarkdownRenderer";

import { useMove } from "hooks/datasworn/useMove";

import { useAppState } from "stores/appState.store";

import { getRollResultLabel } from "data/rollResultLabel";

import { IStatRoll } from "services/gameLog.service";

import { AccordionTitle } from "./AccordionTitle";
import { RollResult } from "./RollResult";
import { RollResultIcons } from "./RollResultIcons";
import { RollValues } from "./RollValues";
import { getMoveOutcome } from "./getMoveOutcome";

export interface StatRollAccordionProps {
  roll: IStatRoll;
}

export function StatRollAccordion(props: StatRollAccordionProps) {
  const { roll } = props;
  const { t } = useTranslation();

  const openDataswornDialog = useAppState((state) => state.openDataswornDialog);

  const stat = capitalize(roll.statKey);

  const move = useMove(roll.moveId ?? "");
  const resultLabel = getRollResultLabel(roll.result);

  const moveOutcome = getMoveOutcome(move, roll.result);

  return (
    <Accordion variant="outlined">
      <AccordionTitle
        id={roll.id}
        uid={roll.uid}
        characterId={roll.characterId}
        title={move?.name ? `${move.name} +${stat}` : `+${stat}`}
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
        {move && (
          <Link
            component="button"
            onClick={() => openDataswornDialog(move._id)}
          >
            {move.name}
          </Link>
        )}
        <RollValues
          d6Result={{
            action: roll.action,
            modifier: roll.modifier,
            adds: roll.adds,
            rollTotal: roll.actionTotal,
          }}
          crossOutD6={!!roll.momentumBurned}
          crossOutD6Value={roll.matchedNegativeMomentum}
          d10Results={[roll.challenge1, roll.challenge2]}
          fixedResult={
            roll.momentumBurned
              ? { title: "Momentum", value: roll.momentumBurned }
              : undefined
          }
        />
        <RollResult
          result={resultLabel}
          extras={[
            ...(roll.challenge1 === roll.challenge2
              ? [t("datasworn.match", "Match")]
              : []),
            ...(roll.action === 1
              ? [t("datasworn.one-on-the-action-die", "One on the action die")]
              : []),
            ...(roll.matchedNegativeMomentum
              ? [
                  t(
                    "datasworn.matched-negative-momentum",
                    "Matched negative momentum",
                  ),
                ]
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
