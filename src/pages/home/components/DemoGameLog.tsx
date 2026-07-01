import { Avatar, AvatarGroup, Box, Card, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { RollSnackbar } from "components/characters/rolls/RollSnackbar";

import { DemoLogEntry } from "./landingDemo";

export interface DemoGameLogProps {
  logEntries: DemoLogEntry[];
}

export function DemoGameLog(props: DemoGameLogProps) {
  const { logEntries } = props;

  const { t } = useTranslation();

  return (
    <Card
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 420,
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={2}
        py={1}
        borderBottom={1}
        borderColor="divider"
      >
        <Typography
          variant="h6"
          component="p"
          textTransform="uppercase"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
        >
          {t("game.log.title", "Game Log")}
        </Typography>
        <AvatarGroup
          sx={{ "& .MuiAvatar-root": { width: 28, height: 28, fontSize: 12 } }}
        >
          <Avatar sx={{ bgcolor: "primary.dark" }}>
            {t("home.demo.player-kira-initial", "K")}
          </Avatar>
          <Avatar sx={{ bgcolor: "success.dark" }}>
            {t("home.demo.player-vesh-initial", "V")}
          </Avatar>
          <Avatar sx={{ bgcolor: "info.dark" }}>
            {t("home.demo.player-you-initial", "I")}
          </Avatar>
        </AvatarGroup>
      </Box>
      <Box
        flexGrow={1}
        display="flex"
        flexDirection="column"
        justifyContent="flex-end"
        gap={2}
        px={2}
        py={2}
        overflow="hidden"
      >
        {logEntries.map((entry) => (
          <Box
            key={entry.id}
            display="flex"
            flexDirection="column"
            alignItems={entry.isYou ? "flex-end" : "flex-start"}
          >
            <Typography variant="body2">{entry.authorName}</Typography>
            {entry.content.type === "roll" ? (
              <RollSnackbar
                rollId={undefined}
                roll={entry.content.roll}
                isExpanded
              />
            ) : (
              <Card variant="outlined" sx={{ px: 1.5, py: 1 }}>
                <Typography variant="body2">{entry.content.text}</Typography>
              </Card>
            )}
            <Typography color="textSecondary" variant="caption">
              {entry.timeText}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box px={2} pb={2}>
        <Box border={1} borderColor="divider" borderRadius={1} px={1.5} py={1}>
          <Typography variant="body2" color="text.secondary">
            {t("home.demo.message-input-placeholder", "Message your table…")}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}
