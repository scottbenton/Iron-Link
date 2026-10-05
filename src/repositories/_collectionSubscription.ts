import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export function createCollectionSubscription<T extends { id: string }>(
  channelName: string,
  table: string,
  filter: string,
  readRows: () => PromiseLike<T[]>,
  onChanges: (
    changed: Record<string, T>,
    removedIds: string[],
    replaceState: boolean,
  ) => void,
  onError: (error: RepositoryError) => void,
  errorNoun: ErrorNoun,
): () => void {
  let active = true;
  let currentRead: { changes: Map<string, T | null> } | undefined;
  const load = () => {
    const read = { changes: new Map<string, T | null>() };
    currentRead = read;
    Promise.resolve(readRows())
      .then((rows) => {
        if (!active || currentRead !== read) return;
        const snapshot = Object.fromEntries(rows.map((row) => [row.id, row]));
        // Keep the complete baseline while applying events received during
        // the query, including deletions of rows in its older snapshot.
        read.changes.forEach((row, id) => {
          if (row) snapshot[id] = row;
          else delete snapshot[id];
        });
        currentRead = undefined;
        onChanges(snapshot, [], true);
      })
      .catch((error) => {
        if (!active || currentRead !== read) return;
        currentRead = undefined;
        console.error(error);
        onError(error);
      });
  };

  const unsubscribe = createSubscription<T>(
    channelName,
    table,
    filter,
    load,
    (payload) => {
      if (!active) return;
      if (payload.errors?.length) {
        onError(
          getRepositoryError(payload.errors, ErrorVerb.Read, errorNoun, true),
        );
      } else if (
        payload.eventType === "INSERT" ||
        payload.eventType === "UPDATE"
      ) {
        currentRead?.changes.set(payload.new.id, payload.new);
        onChanges({ [payload.new.id]: payload.new }, [], false);
      } else if (payload.eventType === "DELETE" && payload.old.id) {
        currentRead?.changes.set(payload.old.id, null);
        onChanges({}, [payload.old.id], false);
      }
    },
    { refreshOnSubscribe: true },
  );

  return () => {
    active = false;
    currentRead = undefined;
    unsubscribe();
  };
}
