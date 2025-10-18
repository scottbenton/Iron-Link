import ClearIcon from "@mui/icons-material/Close";
import { Box, Fab, Slide } from "@mui/material";
import { TransitionGroup } from "react-transition-group";

import { NormalRollActions } from "pages/games/characterSheet/components/GameLog/NormalRollActions";
import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useAppState } from "stores/appState.store";

import { RollSnackbar } from "./RollSnackbar";

export function RollSnackbarSection() {
  const rolls = useAppState((state) => state.visibleRolls);
  const clearRoll = useAppState((state) => state.clearRoll);
  const clearRolls = useAppState((state) => state.clearAllRolls);

  const gameId = useGameIdOptional();

  return (
    <Box
      position={"fixed"}
      zIndex={10000}
      bottom={(theme) => theme.spacing(2)}
      right={(theme) => theme.spacing(2)}
      ml={2}
      display={"flex"}
      flexDirection={"column"}
      alignItems={"flex-end"}
      sx={(theme) => ({
        transition: theme.transitions.create(["bottom", "transform"]),
        pointerEvents: "none",
        "&>div": {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          pointerEvents: "none",
        },
      })}
    >
      <TransitionGroup>
        {rolls.map(({ id, roll }, index, array) => (
          <Slide direction={"left"} key={id}>
            <Box mt={1} sx={{ pointerEvents: "all" }}>
              {}
              <RollSnackbar
                roll={roll}
                rollId={id}
                isExpanded={index === array.length - 1}
                onSnackbarClick={() => clearRoll(index)}
                actions={
                  gameId && id && <NormalRollActions rollId={id} roll={roll} />
                }
              />
            </Box>
          </Slide>
        ))}
      </TransitionGroup>
      <Slide direction={"left"} in={rolls.length > 0} unmountOnExit>
        <Fab
          variant={"extended"}
          size={"medium"}
          color={"primary"}
          onClick={() => clearRolls()}
          sx={{ mt: 2, pointerEvents: "all" }}
        >
          Clear All
          <ClearIcon sx={{ ml: 1 }} />
        </Fab>
      </Slide>
    </Box>
  );
}
