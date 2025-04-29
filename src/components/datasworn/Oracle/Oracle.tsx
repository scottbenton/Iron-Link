import { SkullIcon } from "@/assets/GameTypeIcon/SkullIcon";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";
import { useOracleRollable } from "@/hooks/datasworn/useOracleRollable";
import { Box, BoxProps, Heading, Tabs } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "../../layout/EmptyState";
import { OracleButton } from "./OracleButton";
import { OracleTable } from "./OracleTable";

export interface OracleProps extends Omit<BoxProps, "children"> {
  oracleId: string;
  hideOracleName?: boolean;
}

export function Oracle(props: OracleProps) {
  const { oracleId, hideOracleName, ...boxProps } = props;
  const oracle = useOracleRollable(oracleId);

  const cursedOracleAlternative = oracle?.tags?.sundered_isles?.cursed_by;
  const cursedOracle = useOracleRollable(
    typeof cursedOracleAlternative === "string"
      ? cursedOracleAlternative
      : undefined,
  );

  const [tabValue, setTabValue] = useState(oracleId);
  useEffect(() => {
    setTabValue(oracleId);
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

  return (
    <Box {...boxProps}>
      {!hideOracleName && <Heading size="lg">{oracle.name}</Heading>}
      <Tabs.Root
        value={tabValue}
        onValueChange={(details) => setTabValue(details.value)}
      >
        {cursedOracle && (
          <Tabs.List>
            <Tabs.Trigger value={oracle._id}>{oracle.name}</Tabs.Trigger>
            <Tabs.Trigger value={cursedOracle._id}>
              <SkullIcon />
              {cursedOracle.name}
            </Tabs.Trigger>
          </Tabs.List>
        )}
        <Tabs.Content value={oracle._id} pt={cursedOracle ? undefined : 0}>
          {(oracle as unknown as { summary?: string }).summary && (
            <MarkdownRenderer
              markdown={(oracle as unknown as { summary: string }).summary}
            />
          )}
          <OracleButton
            oracleId={oracle._id}
            colorPalette={"gray"}
            variant="outline"
          >
            {t("datasworn.roll-oracle-button", "Roll {{oracleName}}", {
              oracleName: oracle.name,
            })}
          </OracleButton>
          <OracleTable oracle={oracle} />
        </Tabs.Content>
        {cursedOracle && (
          <Tabs.Content value={cursedOracle._id}>
            {(cursedOracle as unknown as { summary?: string }).summary && (
              <MarkdownRenderer
                markdown={
                  (cursedOracle as unknown as { summary: string }).summary
                }
              />
            )}
            <OracleButton
              oracleId={cursedOracle._id}
              colorPalette={"gray"}
              variant="outline"
            >
              {t("datasworn.roll-oracle-button", "Roll {{oracleName}}", {
                oracleName: cursedOracle.name,
              })}
            </OracleButton>
            <OracleTable oracle={cursedOracle} />
          </Tabs.Content>
        )}
      </Tabs.Root>
    </Box>
  );
}
