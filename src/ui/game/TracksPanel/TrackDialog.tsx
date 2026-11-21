import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { css } from "styled-system/css";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogHeader,
} from "../../components/Dialog";
import { RadioCard, RadioCardGroup } from "../../components/RadioCard";
import { Select } from "../../components/Select";
import { TextArea } from "../../components/TextArea";
import { TextField } from "../../components/TextField";
import { Clock } from "../Clock";
import { ProgressRank, getRankLabels, ticksPerMark } from "../ProgressTrack";
import {
  TracksPanelStrings,
  getDefaultTracksPanelStrings,
} from "./tracksPanelStrings";
import type { TrackItem, TrackKind } from "./tracksPanelTypes";

const ranks: ProgressRank[] = [
  "troublesome",
  "dangerous",
  "formidable",
  "extreme",
  "epic",
];
const segmentChoices = ["4", "6", "8", "10"] as const;

// The clock under each count, like the app's own segment picker.
const clockPictureStyles = css({
  display: "flex",
  justifyContent: "center",
  paddingBlockStart: "1",
});

export interface TrackDialogValues {
  label: string;
  description: string;
  /** Progress tracks. */
  rank?: ProgressRank;
  /** Editing a progress track whose rank changed: start it again. */
  resetProgress?: boolean;
  /** Clocks. */
  segments?: number;
}

export interface TrackDialogProps {
  open: boolean;
  onClose: () => void;
  /** What it adds, or the kind of `track` when editing. */
  kind: TrackKind;
  /** The track or clock to edit. Adds a new one without it. */
  track?: TrackItem;
  /** Called with the form's values; close the dialog when saved. */
  onSave: (values: TrackDialogValues) => void;
  /** While saving: the main button shows a spinner. */
  saving?: boolean;
  rankLabels?: Partial<Record<ProgressRank, string>>;
  strings?: Partial<TracksPanelStrings>;
}

/**
 * Adds or edits a vow, journey, fight, scene challenge or clock: a title,
 * a description, then the rank (with how much a mark adds) or the clock's
 * segments. Changing an existing track's rank offers to reset its progress.
 * Remount it (a `key`) to start a fresh form.
 */
export function TrackDialog(props: TrackDialogProps) {
  const {
    open,
    onClose,
    kind,
    track,
    onSave,
    saving,
    rankLabels: rankLabelsProp,
    strings: stringsProp,
  } = props;
  const { t } = useTranslation();
  const strings = { ...getDefaultTracksPanelStrings(t), ...stringsProp };
  const rankLabels = { ...getRankLabels(t), ...rankLabelsProp };
  const isClock = kind === "clock";
  const initialRank = track && track.kind !== "clock" ? track.rank : undefined;

  const [label, setLabel] = useState(track?.label ?? "");
  const [description, setDescription] = useState(track?.description ?? "");
  const [rank, setRank] = useState<ProgressRank>(initialRank ?? "dangerous");
  const [resetProgress, setResetProgress] = useState(false);
  const [segments, setSegments] = useState(
    String(track?.kind === "clock" ? track.segments : 6),
  );
  const [showErrors, setShowErrors] = useState(false);
  const titleError = showErrors && !label.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!label.trim()) {
      setShowErrors(true);
      event.currentTarget.querySelector("input")?.focus();
      return;
    }
    onSave(
      isClock
        ? {
            label: label.trim(),
            description: description.trim(),
            segments: Number(segments),
          }
        : {
            label: label.trim(),
            description: description.trim(),
            rank,
            resetProgress:
              !!track && rank !== initialRank ? resetProgress : undefined,
          },
    );
  };

  const kindLabel = strings.kindLabels[kind];

  return (
    <Dialog open={open} onClose={onClose} onSubmit={handleSubmit} size="sm">
      <DialogHeader
        title={
          track
            ? strings.dialogEditTitle(kindLabel)
            : strings.dialogAddTitle(kindLabel)
        }
      />
      <DialogBody>
        <TextField
          label={strings.dialogTitleField}
          required
          value={label}
          onValueChange={setLabel}
          error={titleError ? strings.dialogTitleRequired : undefined}
        />
        <TextArea
          label={strings.dialogDescriptionField}
          value={description}
          onValueChange={setDescription}
          minRows={2}
        />
        {isClock ? (
          <RadioCardGroup<string>
            label={strings.dialogSegmentsField}
            value={segments}
            onValueChange={setSegments}
            minCardWidth="72px"
          >
            {segmentChoices.map((choice) => (
              <RadioCard key={choice} value={choice} title={choice} size="sm">
                <span className={clockPictureStyles} aria-hidden>
                  <Clock
                    label={choice}
                    segments={Number(choice)}
                    value={0}
                    size="sm"
                    hideLabel
                  />
                </span>
              </RadioCard>
            ))}
          </RadioCardGroup>
        ) : (
          <>
            <Select<ProgressRank>
              label={strings.dialogRankField}
              value={rank}
              onValueChange={(value) => value && setRank(value)}
              options={ranks.map((value) => ({
                value,
                label: rankLabels[value],
                description: strings.dialogRankDescription(ticksPerMark[value]),
              }))}
            />
            {track && rank !== initialRank && (
              <Checkbox
                label={strings.dialogResetProgress}
                description={strings.dialogResetProgressHint}
                checked={resetProgress}
                onCheckedChange={setResetProgress}
              />
            )}
          </>
        )}
      </DialogBody>
      <DialogActions>
        <DialogClose
          render={
            <Button type="button" disabled={saving}>
              {strings.dialogCancel}
            </Button>
          }
        />
        <Button type="submit" variant="primary" loading={saving}>
          {track ? strings.dialogSave : strings.dialogAddTitle(kindLabel)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
