import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Tab } from "@mui/material";
import { KeyboardEvent, MouseEvent } from "react";
import { useTranslation } from "react-i18next";

export interface NoteTabProps {
  name: string;
  onClose: () => void;
  value: string;
  id: string;
  "aria-controls": string;
  onAuxClick?: (event: MouseEvent<HTMLElement>) => void;
  onMouseDown?: (event: MouseEvent<HTMLElement>) => void;
  // Set by Tabs when it clones its children, along with `onChange`,
  // `indicator` and the like, which all go on to the Tab.
  selected?: boolean;
}

// Arrow keys, Home and End move between the strip's tabs. Tabs' own
// handler steps through the strip's direct children, which here are
// wrappers holding a tab and its close button, so the tab handles them.
function handleTabKeyDown(event: KeyboardEvent<HTMLElement>) {
  const tablist = event.currentTarget.closest('[role="tablist"]');
  if (!tablist) return;
  const tabs = Array.from(
    tablist.querySelectorAll<HTMLElement>('[role="tab"]'),
  ).filter((tab) => !tab.hasAttribute("disabled"));
  const index = tabs.indexOf(event.currentTarget);
  if (index === -1) return;

  let next: HTMLElement | undefined;
  if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
  else if (event.key === "ArrowLeft")
    next = tabs[(index - 1 + tabs.length) % tabs.length];
  else if (event.key === "Home") next = tabs[0];
  else if (event.key === "End") next = tabs[tabs.length - 1];
  if (!next) return;

  event.preventDefault();
  event.stopPropagation();
  next.focus();
}

// A Notes tab with its close button beside it rather than inside it, since
// a button inside a tab is a control inside a control that screen readers
// cannot reach. MUI Tabs clones its children with `selected`, `onChange`
// and the like, which go on to the Tab.
export function NoteTab(props: NoteTabProps) {
  const { name, onClose, ...tabProps } = props;
  const selected = !!props.selected;
  // Still carries `selected` and the rest of what Tabs adds, at run time.
  const forwardedProps: Omit<NoteTabProps, "name" | "onClose" | "selected"> =
    tabProps;
  const { t } = useTranslation();

  return (
    <Box
      role="none"
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        minWidth: 90,
        pr: 0.5,
        borderRight: 1,
        borderColor:
          theme.palette.grey[theme.palette.mode === "light" ? 200 : 800],
        backgroundColor: selected ? "background.paper" : undefined,
        "& .close-tab-button": {
          visibility: selected ? "visible" : "hidden",
        },
        "&:hover .close-tab-button": {
          visibility: "visible",
        },
      })}
    >
      <Tab
        {...forwardedProps}
        label={name}
        onKeyDown={handleTabKeyDown}
        // The wrapper takes Tab's usual minimum width, with the close
        // button inside it, as it was when the button was in the label.
        sx={{
          textTransform: "none",
          py: 0.5,
          minHeight: 0,
          minWidth: 0,
          maxWidth: 328,
          flexGrow: 1,
          pr: 1,
        }}
      />
      <IconButton
        className="close-tab-button"
        size="small"
        aria-label={t("notes.tabs.close-tab", "Close {{name}}", { name })}
        onClick={onClose}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  );
}
