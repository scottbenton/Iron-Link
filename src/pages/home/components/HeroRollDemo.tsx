import RollIcon from "@mui/icons-material/Casino";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Stat } from "components/datasworn/Stat";

import { Card } from "ui/components/Card";
import { Text } from "ui/components/Text";
import { RollCard } from "ui/game/RollCard";
import { DiceFiveIcon, Icon } from "ui/icons";
import { Box, HStack } from "ui/primitives";

import { useRollStatAndAddToLog } from "pages/games/hooks/useRollStatAndAddToLog";

import { getRollSummaryNames } from "hooks/useRollSummary";

import { toRollData } from "lib/rollSummary.lib";

import { IStatRoll } from "services/gameLog.service";

import { DemoStat } from "./landingDemo";

const DEMO_MOMENTUM = 2;

export interface HeroRollDemoProps {
  onRoll: (roll: IStatRoll) => void;
}

export function HeroRollDemo(props: HeroRollDemoProps) {
  const { onRoll } = props;

  const { t } = useTranslation();

  const demoStats: DemoStat[] = [
    { key: "edge", label: t("home.demo.stat-edge", "Edge"), value: 1 },
    { key: "heart", label: t("home.demo.stat-heart", "Heart"), value: 2 },
    { key: "iron", label: t("home.demo.stat-iron", "Iron"), value: 3 },
    { key: "shadow", label: t("home.demo.stat-shadow", "Shadow"), value: 1 },
    { key: "wits", label: t("home.demo.stat-wits", "Wits"), value: 2 },
  ];

  const [latestRoll, setLatestRoll] = useState<IStatRoll>();
  const rollStat = useRollStatAndAddToLog();

  const handleStatClick = (stat: DemoStat) => {
    const roll = rollStat({
      statId: stat.key,
      statLabel: stat.label,
      statModifier: stat.value,
      momentum: DEMO_MOMENTUM,
      hideSnackbar: true,
    });
    setLatestRoll(roll);
    onRoll(roll);
  };

  return (
    <Box>
      <Text variant="label" as="p" color="muted" css={{ marginBlockEnd: "2" }}>
        {t("home.hero.demo-caption", "Click a stat to roll it")}
      </Text>
      {/* The stat cards are the app's own until the character sheet slice. */}
      <HStack flexWrap="wrap" gap="2">
        {demoStats.map((stat) => (
          <Stat
            key={stat.key}
            label={stat.label}
            value={stat.value}
            action={{
              actionLabel: t("common.roll", "Roll"),
              ActionIcon: RollIcon,
            }}
            onActionClick={() => handleStatClick(stat)}
          />
        ))}
      </HStack>
      <Box marginBlockStart="4">
        {latestRoll ? (
          <RollCard
            roll={toRollData(latestRoll, getRollSummaryNames(latestRoll))}
          />
        ) : (
          <Card padding="sm">
            <HStack gap="2">
              <Icon icon={DiceFiveIcon} size="md" color="muted" />
              <Text variant="bodySm" color="muted">
                {t(
                  "home.hero.demo-placeholder",
                  "Your roll will appear here. Beat both challenge dice for a strong hit.",
                )}
              </Text>
            </HStack>
          </Card>
        )}
      </Box>
    </Box>
  );
}
