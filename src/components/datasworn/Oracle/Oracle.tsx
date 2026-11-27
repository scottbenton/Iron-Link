import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { SectionTab, SectionTabList, TabPanel, Tabs } from "ui/components/Tabs";
import { VisuallyHidden } from "ui/components/VisuallyHidden";
import { SkullIcon } from "ui/icons";
import { EmptyState } from "ui/layout";

import { useOracleRollable } from "hooks/datasworn/useOracleRollable";

import { OracleVariant } from "./OracleVariant";

export interface OracleProps {
  oracleId: string;
}

// An oracle's table and roll button. A Sundered Isles oracle with a cursed
// variant shows both, as two tabs.
export function Oracle(props: OracleProps) {
  const { oracleId } = props;
  const { t } = useTranslation();
  const oracle = useOracleRollable(oracleId);

  const cursedOracleAlternative = oracle?.tags?.sundered_isles?.cursed_by;
  const cursedOracle = useOracleRollable(
    typeof cursedOracleAlternative === "string"
      ? cursedOracleAlternative
      : undefined,
  );
  const activeOracleId = oracle?._id ?? oracleId;
  const [currentOracle, setCurrentOracle] = useState(activeOracleId);

  useEffect(() => {
    setCurrentOracle(activeOracleId);
  }, [activeOracleId]);

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

  if (!cursedOracle) {
    return <OracleVariant oracle={oracle} />;
  }

  return (
    <Tabs
      value={currentOracle}
      onValueChange={(value) => setCurrentOracle(value as string)}
    >
      <SectionTabList
        variant="underline"
        aria-label={t("datasworn.oracle-tabs", "Oracle variants")}
        css={{ marginBlockEnd: "3" }}
      >
        <SectionTab value={oracle._id}>{oracle.name}</SectionTab>
        <SectionTab value={cursedOracle._id} icon={<SkullIcon aria-hidden />}>
          <VisuallyHidden>
            {t("datasworn.oracle-tabs.cursed", "Cursed")}{" "}
          </VisuallyHidden>
          {cursedOracle.name}
        </SectionTab>
      </SectionTabList>
      <TabPanel value={oracle._id}>
        <OracleVariant oracle={oracle} />
      </TabPanel>
      <TabPanel value={cursedOracle._id}>
        <OracleVariant oracle={cursedOracle} />
      </TabPanel>
    </Tabs>
  );
}
