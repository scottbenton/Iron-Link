import { Box, SxProps, Tab, Tabs, Theme, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { SkullIcon } from "assets/SkullIcon";

import { EmptyState } from "components/Layout/EmptyState";
import { MarkdownRenderer } from "components/MarkdownRenderer";

import { useOracleRollable } from "hooks/datasworn/useOracleRollable";

import { OracleButton } from "./OracleButton";
import { OracleTable } from "./OracleTable";

export interface OracleProps {
  oracleId: string;
  hideOracleName?: boolean;
  sx?: SxProps<Theme>;
}

export function Oracle(props: OracleProps) {
  const { oracleId, hideOracleName, sx } = props;
  const oracle = useOracleRollable(oracleId);

  const cursedOracleAlternative = oracle?.tags?.sundered_isles?.cursed_by;
  const cursedOracle = useOracleRollable(
    typeof cursedOracleAlternative === "string"
      ? cursedOracleAlternative
      : undefined,
  );
  const [currentOracle, setCurrentOracle] = useState(oracleId);

  useEffect(() => {
    setCurrentOracle(oracleId);
  }, [oracleId]);

  const { t } = useTranslation();

  if (!oracle) {
    return (
      <EmptyState
        message={t(
          "datasworn.oracles.not-found",
          "Could not find oracle with id {{oracleId}}",
          { oracleId },
        )}
      />
    );
  }

  console.debug(cursedOracle?.tags);
  return (
    <Box sx={sx} bgcolor="background.paper">
      {!hideOracleName && <Typography variant={"h6"}>{oracle.name}</Typography>}
      {cursedOracle && (
        <Tabs
          value={currentOracle}
          onChange={(_, newValue) => setCurrentOracle(newValue)}
          aria-label={t("datasworn.oracle-tabs", "Oracle Variant Tabs")}
          sx={{ mb: 1 }}
        >
          <Tab
            label={oracle.name}
            value={oracle._id}
            id={`${oracle._id}-tab`}
            aria-controls={`${oracle._id}-tabpanel`}
          />
          <Tab
            label={
              <Box
                component="span"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <SkullIcon
                  aria-label={t("datasworn.oracle-tabs.cursed", "Cursed")}
                  sx={{ display: "inline", mr: 0.5 }}
                  color="action"
                />
                {cursedOracle.name}
              </Box>
            }
            value={cursedOracle._id}
            id={`${cursedOracle._id}-tab`}
            aria-controls={`${oracle._id}-tabpanel`}
          />
        </Tabs>
      )}
      <Box
        role={cursedOracle ? "tabpanel" : undefined}
        id={`${oracle._id}-tabpanel`}
        aria-labelledby={cursedOracle ? `${oracle._id}-tab` : undefined}
      >
        {currentOracle === oracle._id && (
          <>
            {(oracle as unknown as { summary?: string }).summary && (
              <MarkdownRenderer
                markdown={(oracle as unknown as { summary: string }).summary}
              />
            )}
            <OracleButton
              oracleId={oracle._id}
              color="inherit"
              variant="outlined"
            >
              {t("datasworn.roll-oracle-button", "Roll {{oracleName}}", {
                oracleName: oracle.name,
              })}
            </OracleButton>
            <OracleTable oracle={oracle} />
          </>
        )}
      </Box>
      {cursedOracle && (
        <Box
          role={cursedOracle ? "tabpanel" : undefined}
          id={`${cursedOracle._id}-tabpanel`}
          aria-labelledby={cursedOracle ? `${cursedOracle._id}-tab` : undefined}
        >
          {currentOracle === cursedOracle._id && (
            <>
              {(cursedOracle as unknown as { summary?: string }).summary && (
                <MarkdownRenderer
                  markdown={
                    (cursedOracle as unknown as { summary: string }).summary
                  }
                />
              )}
              <OracleButton
                oracleId={cursedOracle._id}
                color="inherit"
                variant="outlined"
              >
                {t("datasworn.roll-oracle-button", "Roll {{oracleName}}", {
                  oracleName: cursedOracle.name,
                })}
              </OracleButton>
              <OracleTable oracle={cursedOracle} />
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
