import { ReactNode, useCallback, useRef, useState } from "react";

import type { WorldOracleChangeInput } from "lib/worldOracleChanges";

import type { WorldOracleChangePreview } from "services/worldOracleChanges.service";

import { WorldOracleChangesDialog } from "./WorldOracleChangesDialog";

export interface WorldOracleChangesRequest {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  loadPreviews: () => Promise<WorldOracleChangePreview[]>;
  // Saves the change itself with the choices made. Rejecting keeps the
  // dialog open.
  save: (changes: WorldOracleChangeInput[]) => Promise<void>;
  // Show the dialog even when no field would roll a different oracle, for a
  // change that needs confirming anyway (unlinking). It then opens at once
  // and shows the check while it runs.
  alwaysConfirm?: boolean;
}

interface ActiveRequest {
  request: WorldOracleChangesRequest;
  resolve: (saved: boolean) => void;
}

// Runs a link, unlink or playset change through the shared save dialog.
// `confirm` resolves true once saved, false if cancelled; without
// alwaysConfirm and with nothing to choose it saves straight away (and
// rejects if that save fails). Render `dialog`.
export function useWorldOracleChangesDialog(): {
  confirm: (request: WorldOracleChangesRequest) => Promise<boolean>;
  dialog: ReactNode;
} {
  const [active, setActive] = useState<ActiveRequest | null>(null);
  const [previews, setPreviews] = useState<WorldOracleChangePreview[] | null>(
    null,
  );
  const [failed, setFailed] = useState(false);
  const loadId = useRef(0);

  const load = useCallback(async (request: WorldOracleChangesRequest) => {
    const id = ++loadId.current;
    setPreviews(null);
    setFailed(false);
    try {
      const loaded = await request.loadPreviews();
      if (id === loadId.current) setPreviews(loaded);
      return loaded;
    } catch (error) {
      console.error(error);
      if (id === loadId.current) setFailed(true);
      return null;
    }
  }, []);

  const confirm = useCallback(
    async (request: WorldOracleChangesRequest) => {
      if (request.alwaysConfirm) {
        return new Promise<boolean>((resolve) => {
          setActive({ request, resolve });
          load(request);
        });
      }
      const loaded = await load(request);
      if (loaded && loaded.every((preview) => !preview.changes.length)) {
        await request.save([]);
        return true;
      }
      return new Promise<boolean>((resolve) => {
        setActive({ request, resolve });
      });
    },
    [load],
  );

  const close = (saved: boolean) => {
    loadId.current++;
    active?.resolve(saved);
    setActive(null);
  };

  const dialog = active && (
    <WorldOracleChangesDialog
      title={active.request.title}
      description={active.request.description}
      confirmLabel={active.request.confirmLabel}
      previews={previews}
      previewFailed={failed}
      onRetry={() => load(active.request)}
      onClose={() => close(false)}
      onConfirm={async (changes) => {
        await active.request.save(changes);
        close(true);
      }}
    />
  );

  return { confirm, dialog };
}
