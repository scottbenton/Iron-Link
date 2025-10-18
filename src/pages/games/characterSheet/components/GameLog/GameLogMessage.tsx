import { Card } from "@mui/material";
import { useEditor } from "@tiptap/react";

import { Editor } from "components/RichTextEditor/Editor";
import { defaultExtensions } from "components/RichTextEditor/rtcExtensions";

import { useUID } from "stores/auth.store";

import { IMessage } from "services/gameLog.service";

export interface GameLogMessageProps {
  message: IMessage;
}
export function GameLogMessage(props: GameLogMessageProps) {
  const { message } = props;

  const uid = useUID();
  const wasWrittenByCurrentUser = message.uid === uid;

  const editor = useEditor({
    content: message.contents,
    extensions: defaultExtensions,
    editable: false,
  });

  return (
    <Card
      variant="outlined"
      sx={{
        p: 1,
        textAlign: wasWrittenByCurrentUser ? "right" : "left",
        "& .ProseMirror": {
          p: 0,
        },
      }}
    >
      <Editor editor={editor} editable={false} Toolbar={() => <></>} />
    </Card>
  );
}
