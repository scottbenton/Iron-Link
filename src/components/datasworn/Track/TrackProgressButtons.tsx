import { Tooltip } from "@/components/ui/tooltip";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { Difficulty } from "@/repositories/tracks.repository";
import { Box, BoxProps, IconButton } from "@chakra-ui/react";
import { Minus, Plus } from "lucide-react";
import { Dispatch, SetStateAction, useCallback } from "react";

export interface TrackProgressButtonsProps extends BoxProps {
  setValue: Dispatch<SetStateAction<number>>;
  difficulty: Difficulty;
}

const difficultyTickMap: Record<Difficulty, number> = {
  [Difficulty.Troublesome]: 12,
  [Difficulty.Dangerous]: 8,
  [Difficulty.Formidable]: 4,
  [Difficulty.Extreme]: 2,
  [Difficulty.Epic]: 1,
};

export function TrackProgressButtons(props: TrackProgressButtonsProps) {
  const { setValue, difficulty, ...boxProps } = props;
  const t = useDataswornTranslations();

  const handleChange = useCallback(
    (increment?: boolean) => {
      setValue((prevValue) => {
        const newValue =
          prevValue + (increment ? 1 : -1) * difficultyTickMap[difficulty];

        return Math.min(40, Math.max(0, newValue));
      });
    },
    [difficulty, setValue],
  );

  const handleDecrement = useCallback(() => {
    handleChange(false);
  }, [handleChange]);
  const handleIncrement = useCallback(() => {
    handleChange(true);
  }, [handleChange]);

  return (
    <Box colorPalette="gray" as="span" pt={1} {...boxProps}>
      <Tooltip content={t("track-decrement-button", "Decrement Progress")}>
        <IconButton
          variant="subtle"
          aria-label={t("track-decrement-button", "Decrement Progress")}
          onClick={handleDecrement}
        >
          <Minus />
        </IconButton>
      </Tooltip>
      <Tooltip content={t("track-increment-button", "Increment Progress")}>
        <IconButton
          variant="subtle"
          aria-label={t("track-increment-button", "Increment Progress")}
          onClick={handleIncrement}
        >
          <Plus />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
