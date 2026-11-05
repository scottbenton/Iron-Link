import AddIcon from "@mui/icons-material/Add";
import MinusIcon from "@mui/icons-material/Remove";
import {
  Box,
  Chip,
  IconButton,
  Link,
  Typography,
  capitalize,
} from "@mui/material";
import { TFunction } from "i18next";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSetAnnouncement } from "stores/appState.store";

import { Difficulty, TrackStatus } from "repositories/tracks.repository";

import { ProgressTrackTick } from "./ProgressTrackTick";
import { useProgressTrackValueText } from "./useProgressTrackValueText";

export interface ProgressTrackProps {
  difficulty?: Difficulty;
  trackType?: string;
  label: string;
  description?: string;
  status?: TrackStatus;
  value: number;
  onChange?: (newValue: number) => void;
  step?: number;
  onEditClick?: () => void;
}

const maxTicks = 40;

export function ProgressTrack(props: ProgressTrackProps) {
  const {
    difficulty,
    trackType,
    label,
    value,
    description,
    status,
    onChange,
    onEditClick,
    step = 1,
  } = props;

  const { t } = useTranslation();

  const announce = useSetAnnouncement();
  const [checks, setChecks] = useState<number[]>([]);

  const getValueText = useProgressTrackValueText();

  const handleChange = (increment: boolean) => {
    if (onChange) {
      const newValue = increment
        ? Math.min(value + step, maxTicks)
        : Math.max(value - step, 0);
      onChange(newValue);
      if (newValue === value) {
        if (increment) {
          announce(
            t(
              "datasworn.progress-track.already-at-max",
              "{{label}} is already fully filled",
              {
                label,
              },
            ),
          );
        } else {
          announce(
            t(
              "datasworn.progress-track.already-at-min",
              "{{label}} is already empty",
              {
                label,
              },
            ),
          );
        }
      } else {
        announce(
          t(
            "datasworn.progress-track.updated",
            "Updated {{label}} to {{fillText}}",
            { label, fillText: getValueText(newValue) },
          ),
        );
      }
    }
  };

  useEffect(() => {
    const checks: number[] = [];

    let checksIndex = 0;
    let checksValue = 0;

    for (let i = 0; i <= maxTicks; i++) {
      if (i % 4 === 0 && i !== 0) {
        checks[checksIndex] = checksValue;
        checksIndex++;
        checksValue = 0;
      }

      if (i < value) {
        checksValue++;
      }
    }

    setChecks(checks);
  }, [value]);

  const labelId = useId();

  return (
    <Box display={"flex"} flexDirection={"column"}>
      <Box
        display="flex"
        flexDirection={onEditClick || description ? "column" : "row"}
      >
        <Box flexGrow={1}>
          {difficulty && (
            <Typography
              lineHeight={"1em"}
              variant={"overline"}
              fontFamily="fontFamilyTitle"
            >
              {getDifficultyLabel(difficulty, t)}
              {trackType ? " " + trackType : ""}
            </Typography>
          )}
          <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent="space-between"
            flexGrow={1}
          >
            <Typography fontFamily={"fontFamilyTitle"} variant={"h6"}>
              <span id={labelId}>{capitalize(label)}</span>
              {status === TrackStatus.Completed && (
                <Chip
                  label={"Completed"}
                  color={"success"}
                  size={"small"}
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            {onEditClick && (
              <Typography fontFamily="fontFamilyTitle">
                <Link
                  color={"inherit"}
                  component={"button"}
                  sx={{ ml: 2 }}
                  aria-label={t("common.edit-named", "Edit {{name}}", {
                    name: label,
                  })}
                  onClick={onEditClick}
                >
                  {t("common.edit", "Edit")}
                </Link>
              </Typography>
            )}
          </Box>
        </Box>
        <Box>
          {description && (
            <Typography
              variant={"subtitle1"}
              color={"text.secondary"}
              whiteSpace={"pre-wrap"}
              sx={{ float: "left" }}
            >
              {description}
            </Typography>
          )}
          {onChange && (
            <Box sx={{ float: "right" }}>
              <IconButton
                aria-label={t(
                  "datasworn.progress-track.button-decrement-named",
                  "Decrement {{label}}",
                  { label },
                )}
                onClick={() => handleChange(false)}
              >
                <MinusIcon />
              </IconButton>
              <IconButton
                aria-label={t(
                  "datasworn.progress-track.button-increment-named",
                  "Increment {{label}}",
                  { label },
                )}
                onClick={() => handleChange(true)}
              >
                <AddIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>
      <Box
        display={"flex"}
        bgcolor={(theme) => theme.palette.background.paper}
        color={(theme) =>
          theme.palette.mode === "light"
            ? theme.palette.grey[600]
            : theme.palette.grey[300]
        }
        borderRadius={1}
        border={1}
        borderColor={(theme) => theme.palette.divider}
        role={"progressbar"}
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={maxTicks}
        aria-valuenow={value}
        aria-valuetext={getValueText(value)}
        alignSelf={"flex-start"}
      >
        {checks.map((value, index) => (
          <Box
            key={index}
            sx={(theme) => ({
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "transparent",
              borderLeftColor: index !== 0 ? theme.palette.divider : undefined,
            })}
          >
            <ProgressTrackTick value={value} key={index} aria-hidden />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function getDifficultyLabel(difficulty: Difficulty, t: TFunction): string {
  switch (difficulty) {
    case Difficulty.Troublesome:
      return t(
        "datasworn.progress-tracks.difficulty-troublesome",
        "Troublesome",
      );
    case Difficulty.Dangerous:
      return t("datasworn.progress-tracks.difficulty-dangerous", "Dangerous");
    case Difficulty.Formidable:
      return t("datasworn.progress-tracks.difficulty-formidable", "Formidable");
    case Difficulty.Extreme:
      return t("datasworn.progress-tracks.difficulty-extreme", "Extreme");
    case Difficulty.Epic:
      return t("datasworn.progress-tracks.difficulty-epic", "Epic");
  }
}
