import DocIcon from "@mui/icons-material/Description";
import {
  Box,
  Card,
  CardActionArea,
  SxProps,
  Theme,
  Typography,
} from "@mui/material";

import { useNotesStore } from "stores/notes.store";

import { INote } from "services/notes.service";

import { NoteActionMenu } from "./NoteActionMenu";

export interface NoteItemProps {
  id: string;
  note: INote;
}

export function NoteItem(props: NoteItemProps) {
  const { id, note } = props;

  return (
    <Card variant={"outlined"} key={id} sx={{ mt: 1, position: "relative" }}>
      <NoteItemContent id={id} note={note} />
    </Card>
  );
}

export function NoteItemContent(
  props: NoteItemProps & { sx?: SxProps<Theme> },
) {
  const { id, note, sx } = props;

  const setOpenItem = useNotesStore((store) => store.setOpenItem);

  return (
    <>
      <CardActionArea
        sx={[
          {
            py: 1.5,
            px: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 1,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        onClick={() => setOpenItem("note", id)}
      >
        <DocIcon sx={{ color: "primary.light" }} />
        <Typography sx={{ flexGrow: 1 }}>{note.title}</Typography>
        <Box
          sx={(theme) => ({
            width: `calc(${theme.spacing(1 - 2)} + 40px)`,
            justifySelf: "flex-end",
            ml: 1,
          })}
        />
      </CardActionArea>
      <NoteActionMenu noteId={id} />
    </>
  );
}
