import { useTranslation } from "react-i18next";

import { RollSnackbar } from "components/characters/rolls/RollSnackbar";

import { Card } from "ui/components/Card";
import { Text } from "ui/components/Text";
import { Box, Stack } from "ui/primitives";

import { DemoLogEntry } from "./landingDemo";

export interface DemoGameLogProps {
  logEntries: DemoLogEntry[];
}

export function DemoGameLog(props: DemoGameLogProps) {
  const { logEntries } = props;

  const { t } = useTranslation();

  return (
    <Card
      padding="none"
      css={{
        height: "full",
        minHeight: "420px",
        gridTemplateRows: "auto 1fr auto",
        gap: "0",
      }}
    >
      <Box
        paddingInline="4"
        paddingBlock="2"
        borderBottom="1px solid"
        borderColor="border.default"
      >
        <Text variant="h4" as="p" uppercase>
          {t("game.log.title", "Game Log")}
        </Text>
      </Box>
      <Stack justifyContent="flex-end" gap="4" padding="4" overflow="hidden">
        {logEntries.map((entry) => (
          <Stack
            key={entry.id}
            gap="1"
            alignItems={entry.isYou ? "flex-end" : "flex-start"}
          >
            <Text variant="bodySm">{entry.authorName}</Text>
            {entry.content.type === "roll" ? (
              <RollSnackbar
                rollId={undefined}
                roll={entry.content.roll}
                isExpanded
              />
            ) : (
              <Card padding="sm">
                <Text variant="bodySm">{entry.content.text}</Text>
              </Card>
            )}
            <Text variant="caption" color="muted">
              {entry.timeText}
            </Text>
          </Stack>
        ))}
      </Stack>
      {/* A picture of the message field: the demo takes no messages. */}
      <Box paddingInline="4" paddingBlockEnd="4">
        <Box
          border="1px solid"
          borderColor="border.default"
          borderRadius="md"
          paddingInline="3"
          paddingBlock="2"
        >
          <Text variant="bodySm" color="muted">
            {t("home.demo.message-input-placeholder", "Message your table…")}
          </Text>
        </Box>
      </Box>
    </Card>
  );
}
