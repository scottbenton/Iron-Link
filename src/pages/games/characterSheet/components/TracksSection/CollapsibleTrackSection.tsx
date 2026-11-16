import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, ButtonBase, Collapse, Theme, Typography } from "@mui/material";
import { ReactNode, useId, useState } from "react";

const barColor = (theme: Theme) =>
  theme.palette.mode === "light" ? "grey.300" : "grey.700";

// Fewer items than this start open.
const OPEN_BELOW = 3;

export interface CollapsibleTrackSectionProps {
  title: string;
  // Whether the items have loaded, so the starting state is decided once.
  loaded: boolean;
  // How many items show when it opens.
  shownCount: number;
  // Controls on the bar's second row (filters, Add), folded with the list.
  controls?: ReactNode;
  children: ReactNode;
}

// A section under the Tracks tab's tracks, with a header bar like theirs.
// The whole bar toggles it. It is open at first only when there are few
// items, decided once they have loaded so adding one later doesn't fold it
// away. One collapse holds the controls and the list, so they fold together.
export function CollapsibleTrackSection({
  title,
  loaded,
  shownCount,
  controls,
  children,
}: CollapsibleTrackSectionProps) {
  // Null until the person opens or closes it.
  const [toggled, setToggled] = useState<boolean | null>(null);
  const [startOpen, setStartOpen] = useState<boolean | null>(null);
  const detailsId = useId();
  if (loaded && startOpen === null) {
    setStartOpen(shownCount < OPEN_BELOW);
  }
  const open = toggled ?? startOpen ?? false;

  return (
    <>
      <Box mx={-2} mt={4} bgcolor={barColor}>
        <Typography
          component="h3"
          variant="h6"
          fontFamily="fontFamilyTitle"
          textTransform="uppercase"
        >
          <ButtonBase
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setToggled(!open)}
            sx={{
              width: "100%",
              justifyContent: "space-between",
              font: "inherit",
              textTransform: "inherit",
              px: 2,
              py: 1.5,
              "&:hover": { bgcolor: "action.hover" },
              "&.Mui-focusVisible": { bgcolor: "action.focus" },
            }}
          >
            {title}
            <ExpandMoreIcon
              sx={{
                transition: (theme) => theme.transitions.create("transform"),
                transform: open ? "rotate(180deg)" : "none",
              }}
            />
          </ButtonBase>
        </Typography>
      </Box>
      {/* It spans the bar's width, since it clips its contents. */}
      <Collapse in={open} id={detailsId} sx={{ mx: -2 }}>
        {controls && (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
            px={2}
            pb={1}
            bgcolor={barColor}
          >
            {controls}
          </Box>
        )}
        <Box px={2}>{children}</Box>
      </Collapse>
    </>
  );
}
