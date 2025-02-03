import {
  Accordion,
  AccordionDetails,
  Box,
  Link,
  Typography,
} from "@mui/material";

import { D10Grey } from "assets/D10Grey";

import { MarkdownRenderer } from "components/MarkdownRenderer";

import { useOracleRollable } from "hooks/datasworn/useOracleRollable";

import { useAppState } from "stores/appState.store";

import { IOracleTableRoll } from "services/gameLog.service";

import { AccordionTitle } from "./AccordionTitle";

export interface OracleRollAccordionProps {
  roll: IOracleTableRoll;
}

export function OracleRollAccordion(props: OracleRollAccordionProps) {
  const { roll } = props;

  const oracle = useOracleRollable(roll.oracleId ?? "");
  const openDataswornDialog = useAppState((state) => state.openDataswornDialog);

  const mainName = oracle?.name ?? roll.rollLabel;

  return (
    <Accordion variant="outlined">
      <AccordionTitle
        id={roll.id}
        uid={roll.uid}
        characterId={roll.characterId}
        title={mainName}
        titleSecondaryContent={
          <Box display="flex" alignItems={"center"}>
            <D10Grey />

            <Typography variant="body2" color="textSecondary" ml={1}>
              {roll.roll}
            </Typography>
          </Box>
        }
      />
      <AccordionDetails>
        {roll.oracleId && oracle && (
          <Link
            component={"button"}
            onClick={() => openDataswornDialog(roll.oracleId)}
          >
            {roll.oracleCategoryName
              ? `${roll.oracleCategoryName}: ${oracle.name}`
              : oracle.name}
          </Link>
        )}
        <MarkdownRenderer markdown={roll.result} typographyVariant="body1" />
      </AccordionDetails>
    </Accordion>
  );
}
