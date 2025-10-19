import SendIcon from "@mui/icons-material/Send";
import { Box, Card, IconButton } from "@mui/material";
import { Editor as TTEditor, useEditor } from "@tiptap/react";
import { useCallback, useMemo, useState } from "react";

import { Editor } from "components/RichTextEditor/Editor";
import {
  CustomEnterExtension,
  defaultExtensions,
} from "components/RichTextEditor/rtcExtensions";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useUID } from "stores/auth.store";
import { useGameLogStore } from "stores/gameLog.store";

import { createId } from "lib/id.lib";

import { IMessage, LogType } from "services/gameLog.service";

import { useCharacterIdOptional } from "../../hooks/useCharacterId";

export function GameLogMessageInput() {
  const uid = useUID();
  const gameId = useGameId();
  const characterId = useCharacterIdOptional();
  const createGameLog = useGameLogStore((store) => store.createLog);

  const [sending, setSending] = useState(false);

  const handleSend = useCallback(
    (editor: TTEditor) => {
      const contents = editor.getHTML();
      if (!uid) return;

      setSending(true);
      const messageLog: IMessage = {
        id: createId(),
        logType: LogType.MESSAGE,
        guidesOnly: false,
        uid: uid,
        gameId: gameId,
        characterId: characterId || null,
        contents: contents,
        timestamp: new Date(),
      };
      createGameLog(messageLog.id, messageLog)
        .then(() => {
          setSending(false);
          editor.commands.clearContent();
        })
        .finally(() => {
          setSending(false);
        });
    },
    [uid, gameId, characterId, createGameLog],
  );
  const extensions = useMemo(() => {
    return [
      ...defaultExtensions,
      CustomEnterExtension.configure({ onEnter: handleSend }),
    ];
  }, [handleSend]);
  const editor = useEditor({
    extensions,
  });

  return (
    <Box
      position={"sticky"}
      left={0}
      right={0}
      zIndex={(theme) => theme.zIndex.appBar}
    >
      <Card
        variant="outlined"
        sx={{ mx: 1, mb: 1, pr: 1, display: "flex", alignItems: "center" }}
      >
        <Box
          flexGrow={1}
          sx={{
            "&>div>div>div": {
              minHeight: "unset",
            },
            "& .ProseMirror": {
              paddingLeft: 2,
              paddingY: 1,
              maxHeight: 128,
            },
          }}
        >
          <Editor editor={editor} Toolbar={() => <></>} editable={!sending} />
        </Box>
        {editor && (
          <IconButton onClick={() => handleSend(editor)} disabled={sending}>
            <SendIcon />
          </IconButton>
        )}
      </Card>
    </Box>
  );
}
