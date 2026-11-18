import { PropsWithChildren, useCallback, useRef, useState } from "react";

import { ConfirmDialog, ConfirmOptions } from "./ConfirmDialog";
import { Confirm, ConfirmContext, ConfirmResult } from "./confirmContext";

export interface ConfirmProviderProps extends PropsWithChildren {
  /** Options every confirm starts from, such as translated defaults. */
  defaultOptions?: ConfirmOptions;
}

/** Renders the dialog behind `useConfirm()`. UIProvider mounts one. */
export function ConfirmProvider(props: ConfirmProviderProps) {
  const { defaultOptions, children } = props;
  const [open, setOpen] = useState(false);
  // Kept after closing so the dialog keeps its text while it fades out.
  const [options, setOptions] = useState<ConfirmOptions>({});
  const resolveRef = useRef<((result: ConfirmResult) => void) | null>(null);

  const settle = useCallback((confirmed: boolean) => {
    resolveRef.current?.({ confirmed });
    resolveRef.current = null;
    setOpen(false);
  }, []);

  const confirm = useCallback<Confirm>(
    (nextOptions = {}) =>
      new Promise<ConfirmResult>((resolve) => {
        // A new question cancels one still open.
        resolveRef.current?.({ confirmed: false });
        resolveRef.current = resolve;
        setOptions({ ...defaultOptions, ...nextOptions });
        setOpen(true);
      }),
    [defaultOptions],
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        {...options}
        open={open}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </ConfirmContext.Provider>
  );
}
