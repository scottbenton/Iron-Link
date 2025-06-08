import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Tab, TabProps } from "@mui/material";

import { NoteItemType, useItemName, useNotesStore } from "stores/notes.store";

export interface NoteTabProps extends TabProps {
  itemType: NoteItemType;
  itemId: string;
  value: string;
}
export function NoteTab(props: NoteTabProps) {
  const { itemType, itemId, value, ...tabProps } = props;

  const itemName = useItemName(itemType, itemId);
  const closeTab = useNotesStore((store) => store.closeTab);

  return (
    <Tab
      {...tabProps}
      sx={(theme) => ({
        textTransform: "none",
        "&.Mui-selected": {
          backgroundColor: "background.paper",
          "& .close-tab-button": { visibility: "visible" },
        },
        borderRight: 1,
        borderColor:
          theme.palette.grey[theme.palette.mode === "light" ? 200 : 800],
        py: 0.5,
        minHeight: 0,
        pr: 0.5,
        "& .close-tab-button": {
          visibility: "hidden",
        },
        "&:hover .close-tab-button": {
          visibility: "visible",
        },
      })} // Add border to the left of each tab except the first one
      label={
        <Box display="flex" alignItems="center" gap={1}>
          {itemName}
          <IconButton
            className="close-tab-button"
            component="span"
            size="small"
            role="button"
            onClick={(evt) => {
              evt.stopPropagation();
              closeTab(value);
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      }
      value={value}
      id={`note-tab-${value}`}
      aria-controls={`note-tabpanel-${value}`}
      onAuxClick={() => closeTab(value)}
      onMouseDown={(event) => {
        if (event.button === 1) {
          event.preventDefault();
          return false;
        }
      }}
    />
  );
}
