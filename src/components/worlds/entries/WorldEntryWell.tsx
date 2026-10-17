import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, ButtonBase, Collapse, Typography, alpha } from "@mui/material";
import { PropsWithChildren, ReactNode, useId, useState } from "react";

// A collapsible group of an entry's fields. Details is an inset band; Guide
// only is dashed, like the secret blocks in Notes, so the two read apart.
export function WorldEntryWell({
  title,
  icon,
  description,
  variant,
  children,
}: PropsWithChildren<{
  title: string;
  icon: ReactNode;
  // A short note beside the title, such as who never sees the fields.
  description?: string;
  variant: "details" | "guide";
}>) {
  const [open, setOpen] = useState(true);
  const titleId = useId();
  const contentId = useId();
  const guide = variant === "guide";

  return (
    <Box
      component="section"
      aria-labelledby={titleId}
      sx={(theme) => ({
        borderRadius: 1,
        border: `1px ${guide ? "dashed" : "solid"} ${
          guide
            ? theme.palette.mode === "light"
              ? "rgba(0, 0, 0, 0.23)"
              : "rgba(255, 255, 255, 0.23)"
            : theme.palette.divider
        }`,
        bgcolor: guide
          ? "action.hover"
          : theme.palette.mode === "light"
            ? theme.palette.grey[50]
            : alpha(theme.palette.grey[800], 0.35),
        // The header button reaches the well's edges, so the whole band is
        // the target; the clip keeps its hover and focus inside the corners.
        overflow: "hidden",
      })}
    >
      <Typography
        component="h2"
        sx={(theme) => ({
          fontFamily: theme.typography.fontFamilyTitle,
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          m: 0,
        })}
      >
        {/* A disclosure button inside the heading, so the heading stays in
            the outline and the button says whether the well is open. */}
        <ButtonBase
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((current) => !current)}
          sx={{
            width: "100%",
            minHeight: 44,
            justifyContent: "flex-start",
            gap: 0.75,
            px: 2,
            py: 1,
            color: "text.secondary",
            "@media (hover: hover) and (pointer: fine)": {
              "&:hover": { bgcolor: "action.hover" },
            },
            "&.Mui-focusVisible": {
              bgcolor: "action.focus",
              outline: (theme) => `2px solid ${theme.palette.primary.main}`,
              outlineOffset: -2,
            },
            font: "inherit",
            letterSpacing: "inherit",
            textAlign: "left",
          }}
        >
          <Box
            component="span"
            sx={{ display: "flex", "& svg": { fontSize: 16 } }}
          >
            {icon}
          </Box>
          <span id={titleId}>{title}</span>
          {description && (
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ ml: "auto", letterSpacing: 0, textTransform: "none" }}
            >
              {description}
            </Typography>
          )}
          <Box
            component="span"
            sx={{ display: "flex", ml: description ? 0.5 : "auto" }}
          >
            {open ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )}
          </Box>
        </ButtonBase>
      </Typography>
      <Collapse in={open} id={contentId}>
        <Box sx={{ px: 2, pt: 0.5, pb: 2 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}
