import { Alert, Box, Skeleton } from "@mui/material";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { parseRepositoryErrorAndGetText } from "providers/SnackbarProvider";

import { useGameLogStore } from "stores/gameLog.store";

import { RepositoryError } from "repositories/errors/RepositoryErrors";

import { IGameLog, LogType } from "services/gameLog.service";

import { LogEntryAccordion } from "./LogEntryAccordionContents";

export function LogEntryNode(props: NodeViewProps) {
  const { node, selected } = props;

  const { t } = useTranslation();

  const logEntryIdUntyped = node.attrs.logId;
  const logEntryId =
    typeof logEntryIdUntyped === "string" ? logEntryIdUntyped : undefined;

  const loadLog = useGameLogStore((store) => store.getGameLog);

  const [logState, setLogState] = useState<
    | {
        loading: true;
        error: undefined;
        log: undefined;
      }
    | {
        loading: false;
        error: undefined;
        log: IGameLog;
      }
    | {
        loading: false;
        error: string;
        log: undefined;
      }
  >({
    loading: true,
    error: undefined,
    log: undefined,
  });

  useEffect(() => {
    if (logEntryId) {
      loadLog(logEntryId)
        .then((log) => {
          setLogState({
            loading: false,
            error: undefined,
            log: log,
          });
        })
        .catch((err) => {
          let errorMessage = t("gameLog.logFailedToLoad", "Failed to load log");
          if (err instanceof RepositoryError) {
            errorMessage = parseRepositoryErrorAndGetText(err);
          }
          setLogState({
            loading: false,
            error: errorMessage,
            log: undefined,
          });
        });
    } else {
      setLogState({
        loading: false,
        error: t("gameLog.logIdNotSet", "Log ID not set"),
        log: undefined,
      });
    }
  }, [logEntryId, loadLog, t]);

  return (
    <NodeViewWrapper>
      <Box
        py={1}
        borderBottom="1px solid"
        borderColor={(theme) =>
          selected ? theme.palette.divider : "transparent"
        }
      >
        {logState.loading ? (
          <Skeleton variant="rounded" width={"100%"} height={48} />
        ) : (
          <>
            {logState.error ? (
              <Alert severity="error">{logState.error}</Alert>
            ) : (
              <>
                {logState.log && logState.log.logType === LogType.ROLL && (
                  <LogEntryAccordion log={logState.log} />
                )}
              </>
            )}
          </>
        )}
      </Box>
    </NodeViewWrapper>
  );
}
