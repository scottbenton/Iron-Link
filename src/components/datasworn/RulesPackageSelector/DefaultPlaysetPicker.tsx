import deepEqual from "fast-deep-equal";
import { Dispatch, SetStateAction, useId } from "react";
import { useTranslation } from "react-i18next";

import { Chip } from "ui/components/Chip";
import { Collapse } from "ui/components/Collapsible";
import { Text } from "ui/components/Text";
import { HStack, Stack } from "ui/primitives";

import { defaultPlaysets } from "data/playset.config";

import { PlaysetConfig } from "repositories/game.repository";

export interface DefaultPlaysetPickerProps {
  expansionId: string;
  /** Shown while the expansion is on. */
  open: boolean;
  activePlaysetConfig: PlaysetConfig;
  onPlaysetChange: Dispatch<SetStateAction<PlaysetConfig>>;
}

/** The ready-made playsets an expansion offers, as toggle chips. */
export function DefaultPlaysetPicker(props: DefaultPlaysetPickerProps) {
  const { expansionId, open, activePlaysetConfig, onPlaysetChange } = props;
  const { t } = useTranslation();
  const headingId = useId();
  const infoId = useId();

  const options = defaultPlaysets[expansionId];
  if (!options) return null;

  return (
    <Collapse open={open}>
      <Stack
        role="group"
        aria-labelledby={headingId}
        aria-describedby={infoId}
        gap="2"
        paddingInlineStart="8"
        paddingBlock="1"
      >
        <Text id={headingId} variant="bodySm" weight="semibold">
          {t("game.playset.default", "Apply a default playset (optional)")}
        </Text>
        <Text id={infoId} variant="bodySm" color="muted">
          {options.info}
        </Text>
        <HStack flexWrap="wrap" gap="2">
          {options.playsets.map((defaultPlayset) => (
            <Chip
              key={defaultPlayset.label}
              selected={deepEqual(activePlaysetConfig, defaultPlayset.playset)}
              onClick={() => onPlaysetChange(defaultPlayset.playset)}
            >
              {defaultPlayset.label}
            </Chip>
          ))}
        </HStack>
      </Stack>
    </Collapse>
  );
}
