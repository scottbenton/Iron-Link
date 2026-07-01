import RollIcon from "@mui/icons-material/Casino";
import { Box, Card, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { RollSnackbar } from "components/characters/rolls/RollSnackbar";
import { Stat } from "components/datasworn/Stat";

import { useRollStatAndAddToLog } from "pages/games/hooks/useRollStatAndAddToLog";

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
      <Typography
        variant="overline"
        component="p"
        color="text.secondary"
        fontFamily={(theme) => theme.typography.fontFamilyTitle}
        lineHeight={1.2}
        mb={1}
      >
        {t(
          "home.hero.demo-caption",
          "These are the real sheet controls — click a stat to roll it",
        )}
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
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
      </Box>
      <Box mt={2}>
        {latestRoll ? (
          <RollSnackbar rollId={undefined} roll={latestRoll} isExpanded />
        ) : (
          <Card
            sx={{
              bgcolor: "grey.800",
              color: "grey.300",
              px: 2,
              py: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <RollIcon fontSize="small" />
            <Typography variant="body2">
              {t(
                "home.hero.demo-placeholder",
                "Your roll will appear here — beat both challenge dice for a strong hit.",
              )}
            </Typography>
          </Card>
        )}
      </Box>
    </Box>
  );
}
