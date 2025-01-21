import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardActionArea,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";
import { ClockCircle } from "components/datasworn/Clocks/ClockCircle";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useTracksStore } from "stores/tracks.store";

import { IClock } from "services/tracks.service";

const segmentOptions = [4, 6, 8, 10];

export interface EditOrCreateClockDialogProps {
  open: boolean;
  handleClose: () => void;
  initialClock?: { clockId: string; clock: IClock };
}

export function EditOrCreateClockDialog(props: EditOrCreateClockDialogProps) {
  const { open, handleClose, initialClock } = props;

  const { t } = useTranslation();
  const gameId = useGameId();

  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState(initialClock?.clock.label ?? "");
  const [description, setDescription] = useState(
    initialClock?.clock.description ?? "",
  );
  const [segments, setSegments] = useState<number | undefined>(
    initialClock?.clock.segments,
  );

  useEffect(() => {
    setTitle(initialClock?.clock.label ?? "");
    setDescription(initialClock?.clock.description ?? "");
    setSegments(initialClock?.clock.segments);
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
      updateTrack(initialClock.clockId, title, description, segments)
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
    <Dialog open={open} onClose={handleDialogClose} maxWidth={"xs"} fullWidth>
      <DialogTitleWithCloseButton onClose={handleDialogClose}>
        {initialClock
          ? t(
              "character.character-sidebar.clock-dialog-edit-clock-title",
              "Edit Clock",
            )
          : t(
              "character.character-sidebar.clock-dialog-add-clock-title",
              "Add Clock",
            )}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Alert severity={"error"}>
              <AlertTitle>{t("common.error", "Error")}</AlertTitle>
              {error}
            </Alert>
          )}
          <TextField
            label={t(
              "character.character-sidebar.clock-dialog-title-input",
              "Title",
            )}
            required
            value={title}
            onChange={(evt) => setTitle(evt.target.value)}
          />
          <TextField
            label={t(
              "character.character-sidebar.clock-dialog-description-input",
              "Description",
            )}
            value={description}
            onChange={(evt) => setDescription(evt.target.value)}
            multiline
            minRows={3}
          />
          <Typography>
            {t(
              "character.character-sidebar.clock-dialog-segments-input",
              "Segments",
            )}
          </Typography>
          <Box display={"flex"} flexWrap={"wrap"}>
            {segmentOptions.map((segmentOption) => (
              <Card
                key={segmentOption}
                variant={"outlined"}
                sx={(theme) => ({
                  bgcolor:
                    segmentOption === segments
                      ? theme.palette.primary.light
                      : theme.palette.background.default,
                  mr: 1,
                  mb: 1,
                })}
              >
                <CardActionArea
                  onClick={() => setSegments(segmentOption)}
                  sx={{ p: 1 }}
                >
                  <Box display={"flex"} alignItems={"baseline"}>
                    <Typography variant={"h5"}>{segmentOption}</Typography>
                    <Typography variant={"subtitle1"} ml={1}>
                      {t(
                        "character.character-sidebar.clock-dialog-segment-count",
                        "segments",
                      )}
                    </Typography>
                  </Box>
                  <ClockCircle segments={segmentOption} value={0} />
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          disabled={loading}
          color={"inherit"}
          onClick={handleDialogClose}
        >
          Cancel
        </Button>
        <Button disabled={loading} variant={"contained"} onClick={handleSubmit}>
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
      </DialogActions>
    </Dialog>
  );
}
