import { useTranslation } from "react-i18next";

import { ProgressTrack } from "components/datasworn/ProgressTrack";

import { Card } from "ui/components/Card";
import { Text } from "ui/components/Text";
import { CompassIcon, LinkIcon, ScrollIcon } from "ui/icons";
import { Box, Flex, Stack } from "ui/primitives";

import { Difficulty } from "repositories/tracks.repository";

import { DemoGameLog } from "./DemoGameLog";
import { GroupPlayCallout } from "./GroupPlayCallout";
import { DemoLogEntry } from "./landingDemo";

export interface GroupPlaySectionProps {
  logEntries: DemoLogEntry[];
  trackTicks: number;
  onTrackTicksChange: (ticks: number) => void;
}

export function GroupPlaySection(props: GroupPlaySectionProps) {
  const { logEntries, trackTicks, onTrackTicksChange } = props;

  const { t } = useTranslation();

  return (
    <Box as="section">
      <Text variant="eyebrow">
        {t("home.group.eyebrow", "Bring your table together")}
      </Text>
      <Text variant="h1" as="h2" css={{ marginBlockStart: "1" }}>
        {t(
          "home.group.title",
          "Most Ironsworn and Starforged tools are built for one.",
        )}
      </Text>
      <Text color="muted" css={{ marginBlockStart: "2", maxWidth: "70ch" }}>
        {t(
          "home.group.subtitle",
          "One invite link brings your whole table into a shared campaign. Every roll, vow, and clock lands on everyone's screen the moment it happens. Roll a stat above and watch the table react.",
        )}
      </Text>
      {/* The log takes the wider share and the column wraps under it once
          the two can't keep their minimum widths side by side. */}
      <Flex flexWrap="wrap" gap="4" marginBlockStart="6">
        <Box flex="3 1 420px" minWidth="0">
          <DemoGameLog logEntries={logEntries} />
        </Box>
        <Stack flex="2 1 300px" minWidth="0" gap="4">
          <Card padding="sm">
            {/* The app's own track until the game page's tracks move over. */}
            <ProgressTrack
              difficulty={Difficulty.Dangerous}
              trackType={t("home.demo.track-type-journey", "Journey")}
              label={t("home.demo.track-label", "Escort the caravan")}
              value={trackTicks}
              onChange={onTrackTicksChange}
            />
            <Text
              variant="caption"
              as="p"
              color="muted"
              css={{ marginBlockStart: "2" }}
            >
              {t(
                "home.demo.track-caption",
                "Shared with the table. Anyone can mark progress.",
              )}
            </Text>
          </Card>
          <GroupPlayCallout
            icon={LinkIcon}
            title={t("home.group.invite-title", "One link invites your table")}
            description={t(
              "home.group.invite-description",
              "Send a single link, and everyone joins your game in seconds.",
            )}
          />
          <GroupPlayCallout
            icon={ScrollIcon}
            title={t("home.group.notes-title", "Shared notes & journals")}
            description={t(
              "home.group.notes-description",
              "Chronicle your saga together with collaborative rich text notes.",
            )}
          />
          <GroupPlayCallout
            icon={CompassIcon}
            title={t("home.group.gm-title", "GM optional")}
            description={t(
              "home.group.gm-description",
              "Whether playing a guided, co-op, or solo game, the same sheet works for every style.",
            )}
          />
        </Stack>
      </Flex>
    </Box>
  );
}
