import ExploreIcon from "@mui/icons-material/Explore";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import LinkIcon from "@mui/icons-material/Link";
import { Box, Card, SvgIconTypeMap, Typography } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { useTranslation } from "react-i18next";

import { ProgressTrack } from "components/datasworn/ProgressTrack";

import { Difficulty } from "repositories/tracks.repository";

import { DemoGameLog } from "./DemoGameLog";
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
    <Box>
      <Typography
        variant="overline"
        component="p"
        color="primary"
        fontFamily={(theme) => theme.typography.fontFamilyTitle}
        letterSpacing={2}
      >
        {t("home.group.eyebrow", "Bring your table together")}
      </Typography>
      <Typography
        variant="h4"
        component="h2"
        fontFamily={(theme) => theme.typography.fontFamilyTitle}
        fontWeight={600}
        mt={0.5}
      >
        {t(
          "home.group.title",
          "Most Ironsworn and Starforged tools are built for one.",
        )}
      </Typography>
      <Typography color="text.secondary" mt={1} maxWidth="70ch">
        {t(
          "home.group.subtitle",
          "One invite link brings your whole table into a shared campaign. Every roll, vow, and clock lands on everyone's screen the moment it happens. Roll a stat above and watch the table react.",
        )}
      </Typography>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "3fr 2fr" }}
        gap={2}
        mt={3}
      >
        <DemoGameLog logEntries={logEntries} />
        <Box display="flex" flexDirection="column" gap={2}>
          <Card variant="outlined" sx={{ px: 2, py: 1.5 }}>
            <Box>
              <ProgressTrack
                difficulty={Difficulty.Dangerous}
                trackType={t("home.demo.track-type-journey", "Journey")}
                label={t("home.demo.track-label", "Escort the caravan")}
                value={trackTicks}
                onChange={onTrackTicksChange}
              />
            </Box>
            <Typography
              variant="caption"
              component="p"
              color="text.secondary"
              mt={1}
            >
              {t(
                "home.demo.track-caption",
                "Shared with the table. Anyone can mark progress.",
              )}
            </Typography>
          </Card>
          <GroupPlayCallout
            Icon={LinkIcon}
            title={t("home.group.invite-title", "One link invites your table")}
            description={t(
              "home.group.invite-description",
              "Send a single link, and everyone joins your game in seconds.",
            )}
          />
          <GroupPlayCallout
            Icon={HistoryEduIcon}
            title={t("home.group.notes-title", "Shared notes & journals")}
            description={t(
              "home.group.notes-description",
              "Chronicle your saga together with collaborative rich text notes.",
            )}
          />
          <GroupPlayCallout
            Icon={ExploreIcon}
            title={t("home.group.gm-title", "GM optional")}
            description={t(
              "home.group.gm-description",
              "Whether playing a guided, co-op, or solo game, the same sheet works for every style.",
            )}
          />
        </Box>
      </Box>
    </Box>
  );
}

interface GroupPlayCalloutProps {
  Icon: OverridableComponent<SvgIconTypeMap>;
  title: string;
  description: string;
}

function GroupPlayCallout(props: GroupPlayCalloutProps) {
  const { Icon, title, description } = props;

  return (
    <Card
      variant="outlined"
      sx={{ px: 2, py: 1.5, display: "flex", gap: 1.5, alignItems: "center" }}
    >
      <Icon color="primary" />
      <Box>
        <Typography variant="body2" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Card>
  );
}
