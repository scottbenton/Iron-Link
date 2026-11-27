import { useTranslation } from "react-i18next";

import { Text } from "ui/components/Text";
import {
  BookOpenIcon,
  CloudCheckIcon,
  Icon,
  PhosphorIcon,
  TargetIcon,
  UserPlusIcon,
} from "ui/icons";
import { Flex, HStack, Stack } from "ui/primitives";

export function SoloFeatureStrip() {
  const { t } = useTranslation();

  const features: { icon: PhosphorIcon; label: string }[] = [
    {
      icon: UserPlusIcon,
      label: t("home.solo.character-creation", "Guided character creation"),
    },
    {
      icon: BookOpenIcon,
      label: t("home.solo.reference", "Full moves & oracle reference"),
    },
    {
      icon: TargetIcon,
      label: t("home.solo.tracks", "Progress tracks & clocks"),
    },
    {
      icon: CloudCheckIcon,
      label: t("home.solo.sync", "Synced across your devices"),
    },
  ];

  return (
    <Stack
      gap="2"
      paddingBlock="4"
      borderBlock="1px solid"
      borderColor="border.default"
    >
      <Text variant="eyebrow">
        {t("home.solo.eyebrow", "And everything solo players expect")}
      </Text>
      <Flex
        as="ul"
        flexWrap="wrap"
        rowGap="2"
        columnGap="4"
        margin="0"
        padding="0"
        listStyle="none"
      >
        {features.map(({ icon, label }) => (
          <HStack as="li" key={label} gap="2">
            <Icon icon={icon} size="md" color="accent" />
            <Text variant="bodySm" as="span" color="muted">
              {label}
            </Text>
          </HStack>
        ))}
      </Flex>
    </Stack>
  );
}
