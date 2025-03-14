import { Dialog } from "@/components/common/Dialog";
import { TextField } from "@/components/common/TextField";
import { ClockCircle } from "@/components/datasworn/Clocks/ClockCircle";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGameId } from "@/hooks/useGameId";
import { IClock } from "@/services/tracks.service";
import { useTracksStore } from "@/stores/tracks.store";
import {
  Alert,
  Button,
  Heading,
  RadioCard,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

const segmentOptions = [4, 6, 8, 10];

export interface EditOrCreateClockDialogProps {
  open: boolean;
  handleClose: () => void;
  initialClock?: IClock;
}

export function EditOrCreateClockDialog(props: EditOrCreateClockDialogProps) {
  const { open, handleClose, initialClock } = props;

  const t = useGameTranslations();
  const gameId = useGameId();

  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState(initialClock?.label ?? "");
  const [description, setDescription] = useState(
    initialClock?.description ?? "",
  );
  const [segments, setSegments] = useState<number | undefined>(
    initialClock?.segments,
  );

  useEffect(() => {
    setTitle(initialClock?.label ?? "");
    setDescription(initialClock?.description ?? "");
    setSegments(initialClock?.segments);
  }, [initialClock]);

  const handleDialogClose = () => {
    setTitle("");
    setDescription("");
    setSegments(undefined);
    setError(undefined);
    setLoading(false);
    handleClose();
  };

  const addTrack = useTracksStore((store) => store.addClock);
  const updateTrack = useTracksStore((store) => store.updateClock);
  const handleSubmit = () => {
    if (!title) {
      setError(
        t(
          "character.character-sidebar.clock-dialog-title-is-required-error",
          "Title is required",
        ),
      );
      return;
    } else if (!segments) {
      setError(
        t(
          "character.character-sidebar.clock-dialog-segments-is-required-error",
          "Please select the number of clock segments you want.",
        ),
      );
      return;
    }

    setLoading(true);

    if (initialClock) {
      updateTrack(initialClock.id, title, description, segments)
        .then(() => {
          handleDialogClose();
        })
        .catch(() => {
          setLoading(false);
          setError(
            t(
              "character.character-sidebar.clock-dialog-error-updating-clock",
              "Error updating clock",
            ),
          );
        });
    } else {
      addTrack(gameId, title, description, segments)
        .then(() => {
          handleDialogClose();
        })
        .catch(() => {
          setLoading(false);
          setError(
            t(
              "character.character-sidebar.clock-dialog-error-creating-clock",
              "Error creating clock",
            ),
          );
        });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      size="xs"
      title={
        initialClock
          ? t("track-section.clock-dialog-edit-clock-title", "Edit Clock")
          : t("track-section.clock-dialog-add-clock-title", "Add Clock")
      }
      content={
        <Stack gap={4} mt={2}>
          {error && (
            <Alert.Root status={"error"}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t("common.error", "Error")}</Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}
          <TextField
            label={t("clock-dialog.title-input", "Title")}
            required
            value={title}
            onChange={setTitle}
          />
          <TextField
            label={t("clock-dialog.description-input", "Description")}
            value={description}
            onChange={setDescription}
          />
          <RadioCard.Root
            value={segments + ""}
            onValueChange={(details) => setSegments(parseInt(details.value))}
            orientation={"vertical"}
            align="center"
            colorPalette={"brand"}
          >
            <RadioCard.Label>
              {t("clock-dialog.segments-input", "Segments")}
            </RadioCard.Label>
            <Stack direction="row" gap={2} flexWrap="wrap">
              {segmentOptions.map((segmentOption) => (
                <RadioCard.Item
                  key={segmentOption}
                  value={segmentOption + ""}
                  cursor="pointer"
                >
                  <RadioCard.ItemHiddenInput />
                  <RadioCard.ItemControl>
                    <ClockCircle segments={segmentOption} value={0} />

                    <RadioCard.ItemText display="flex" alignItems={"baseline"}>
                      <Text color="fg.muted">
                        <Heading as="span" mr={1} color="fg">
                          {segmentOption}
                        </Heading>
                        {t(
                          "character.character-sidebar.clock-dialog-segment-count",
                          "segments",
                        )}
                      </Text>
                    </RadioCard.ItemText>
                  </RadioCard.ItemControl>
                </RadioCard.Item>
              ))}
            </Stack>
          </RadioCard.Root>
        </Stack>
      }
      actions={
        <>
          <Button
            disabled={loading}
            variant="ghost"
            onClick={handleDialogClose}
          >
            Cancel
          </Button>
          <Button colorPalette="brand" loading={loading} onClick={handleSubmit}>
            {initialClock
              ? t(
                  "character.character-sidebar.clock-dialog-save-clock-button",
                  "Save Clock",
                )
              : t(
                  "character.character-sidebar.clock-dialog-add-clock-button",
                  "Add Clock",
                )}
          </Button>
        </>
      }
    />
  );
}
