import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useUID } from "stores/auth.store";
import { useMoves, useOracles } from "stores/dataswornTree.store";
import { useDataswornTreeStore } from "stores/dataswornTree.store";

import { RollType } from "repositories/shared.types";

import { IGameLog } from "services/gameLog.service";

import { ClockProgressionRollForm } from "./AddRollForms/ClockProgressionRollForm";
import { OracleOption, OracleRollForm } from "./AddRollForms/OracleRollForm";
import { SpecialTrackRollForm } from "./AddRollForms/SpecialTrackRollForm";
import {
  MoveOption,
  StatKeyOption,
  StatRollForm,
} from "./AddRollForms/StatRollForm";
import { TrackProgressRollForm } from "./AddRollForms/TrackProgressRollForm";

interface AddRollDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (roll: IGameLog) => Promise<void>;
}

interface RollTypeOption {
  value: RollType;
  label: string;
  description: string;
}

export function AddRollDialog(props: AddRollDialogProps) {
  const { open, onClose, onSubmit } = props;
  const { t } = useTranslation();

  const uid = useUID();
  const gameId = useGameId();
  const characterId = useCharacterIdOptional();

  const { moveMap } = useMoves();
  const { oracleRollableMap } = useOracles();
  const statRules = useDataswornTreeStore((store) => store.statRules);

  const [selectedRollType, setSelectedRollType] = useState<RollType>(
    RollType.Stat,
  );
  const [submitting, setSubmitting] = useState(false);

  // Roll type options
  const rollTypeOptions: RollTypeOption[] = useMemo(
    () => [
      {
        value: RollType.Stat,
        label: t("roll-type.stat", "Stat Roll"),
        description: t(
          "roll-type.stat-desc",
          "Roll with a stat or a condition meter against your challenge dice",
        ),
      },
      {
        value: RollType.OracleTable,
        label: t("roll-type.oracle", "Oracle Roll"),
        description: t("roll-type.oracle-desc", "Roll on an oracle table"),
      },
      {
        value: RollType.TrackProgress,
        label: t("roll-type.track-progress", "Track Progress Roll"),
        description: t(
          "roll-type.track-progress-desc",
          "Roll against your progress track completion",
        ),
      },
      {
        value: RollType.SpecialTrackProgress,
        label: t("roll-type.special-track", "Special Track Roll"),
        description: t(
          "roll-type.special-track-desc",
          "Roll against your special track progression",
        ),
      },
      {
        value: RollType.ClockProgression,
        label: t("roll-type.clock", "Clock Progression"),
        description: t(
          "roll-type.clock-desc",
          "Roll to see if your clock progresses",
        ),
      },
    ],
    [t],
  );

  // Move options (for stat rolls and track progress rolls)
  const moveOptions: MoveOption[] = useMemo(() => {
    return Object.values(moveMap).map((move) => ({
      id: move._id,
      label: move.name,
    }));
  }, [moveMap]);

  // Oracle options (for oracle rolls and clock progression)
  const oracleOptions: OracleOption[] = useMemo(() => {
    return Object.values(oracleRollableMap).map((oracle) => ({
      id: oracle._id,
      label: oracle.name,
    }));
  }, [oracleRollableMap]);

  // Stat key options (from active rulesets)
  const statKeyOptions: StatKeyOption[] = useMemo(() => {
    return Object.entries(statRules).map(([key, stat]) => ({
      value: key,
      label: stat.label,
    }));
  }, [statRules]);

  const handleRollTypeChange = useCallback(
    (_: React.SyntheticEvent, newRollType: RollType) => {
      setSelectedRollType(newRollType);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (roll: IGameLog) => {
      if (!uid || !gameId) return;

      setSubmitting(true);
      try {
        // Add base properties to the roll
        const completeRoll: IGameLog = {
          ...roll,
          gameId,
          characterId: characterId || null,
          uid,
          guidesOnly: false,
          isManual: true,
        };

        await onSubmit(completeRoll);
        onClose();
      } catch (error) {
        console.error("Failed to submit roll:", error);
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit, onClose, uid, gameId, characterId],
  );

  const renderRollTypeSelector = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t("add-roll.select-type", "Select Roll Type")}
      </Typography>
      <Tabs
        value={selectedRollType}
        onChange={handleRollTypeChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {rollTypeOptions.map((option) => (
          <Tab
            key={option.value}
            value={option.value}
            label={option.label}
            sx={{ minWidth: 120 }}
          />
        ))}
      </Tabs>
      <Typography variant="body2" color="text.secondary">
        {
          rollTypeOptions.find((opt) => opt.value === selectedRollType)
            ?.description
        }
      </Typography>
    </Box>
  );

  const renderFormFields = () => {
    switch (selectedRollType) {
      case RollType.Stat:
        return (
          <StatRollForm
            moveOptions={moveOptions}
            statKeyOptions={statKeyOptions}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        );
      case RollType.OracleTable:
        return (
          <OracleRollForm
            oracleOptions={oracleOptions}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        );
      case RollType.TrackProgress:
        return (
          <TrackProgressRollForm
            moveOptions={moveOptions}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        );
      case RollType.SpecialTrackProgress:
        return (
          <SpecialTrackRollForm
            moveOptions={moveOptions}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        );
      case RollType.ClockProgression:
        return (
          <ClockProgressionRollForm
            oracleOptions={oracleOptions}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      onClick={(evt) => evt.stopPropagation()}
    >
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("add-roll.title", "Add Manual Roll")}
      </DialogTitleWithCloseButton>

      <DialogContent>
        {renderRollTypeSelector()}
        {renderFormFields()}
      </DialogContent>

      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={submitting}>
          {t("common.cancel", "Cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
