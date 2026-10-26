import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";

import { useAuthStore } from "stores/auth.store";

import { getSecretSurfaceKey } from "repositories/richTextSecrets.repository";

import {
  RichTextSecretsService,
  SecretSurface,
} from "services/richTextSecrets.service";
import type { RoomKeySource } from "services/roomKeys.service";

import { useRoomKey } from "../useRoomKey";
import { useRtcDocument } from "../useRtcDocument";
import { getSecretsMentions, getSecretsText } from "./secretsDocument";

// Who can read the surface while it isn't shared with players yet.
export type SecretsAudience = "you" | "guides";

export interface SecretsConfig {
  surface: SecretSurface;
  // The Guide-only room the companion is shared live in.
  roomKeySource: RoomKeySource;
  // Set while no player can read the surface, for a note on each block that
  // it isn't shared yet: only this Guide (a note only its author reads), or
  // the Guides.
  sharedOnlyWith: SecretsAudience | null;
  // Whether this Guide may add new secrets here. Existing ones always show.
  canInsert: boolean;
}

// A Guide's companion document of secrets for one surface: loaded, saved by
// merging, and shared live in the Guide room. Null config means this reader
// gets no secrets; nothing is read or joined.
export function useSecretsCompanion(
  config: SecretsConfig | null,
  options: {
    // A Guide who can't edit the surface reads its secrets and saves nothing.
    readOnly: boolean;
    onSaveError?: (error: unknown) => void;
  },
): { doc: Y.Doc | null; saving: boolean; failed: boolean } {
  const surfaceKey = config ? getSecretSurfaceKey(config.surface) : null;
  const surfaceRef = useRef(config?.surface);
  surfaceRef.current = config?.surface;

  const { readOnly, onSaveError } = options;
  const docRef = useRef<Y.Doc | null>(null);
  const store = useMemo(
    () =>
      surfaceKey && surfaceRef.current
        ? RichTextSecretsService.createStore(
            surfaceRef.current,
            () => useAuthStore.getState().token,
            () =>
              docRef.current
                ? getSecretsMentions(docRef.current)
                : ({} as Record<string, never>),
          )
        : undefined,
    [surfaceKey],
  );

  const [loaded, setLoaded] = useState<{
    key: string;
    content: Uint8Array;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!store || !surfaceKey) return;
    let current = true;
    setFailed(false);
    store
      .read(undefined)
      .then(({ content }) => {
        if (current) {
          setLoaded({ key: surfaceKey, content: content ?? new Uint8Array() });
        }
      })
      .catch((e) => {
        console.error(e);
        if (current) setFailed(true);
      });
    return () => {
      current = false;
    };
  }, [store, surfaceKey]);

  const initialValue =
    loaded && loaded.key === surfaceKey ? loaded.content : null;
  // Join the Guide room only where secrets can be added or already exist.
  const live =
    !!config &&
    !!initialValue &&
    ((config.canInsert && !readOnly) || initialValue.length > 0);
  const roomKey = useRoomKey(live && config ? config.roomKeySource : null);
  const getText = useCallback(
    () => (docRef.current ? getSecretsText(docRef.current) : ""),
    [],
  );

  const { doc, saving } = useRtcDocument({
    documentId: `secrets:${surfaceKey ?? "none"}`,
    roomName: `secrets-${surfaceKey ?? "none"}`,
    roomKey,
    initialValue,
    contentStore: readOnly ? undefined : store,
    getText,
    onSaveError,
  });
  docRef.current = doc;

  return { doc: config ? doc : null, saving, failed };
}
