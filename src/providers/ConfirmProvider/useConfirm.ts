import { useCallback, useContext, useEffect, useId } from "react";

import { ConfirmContext, ConfirmParams } from "./ConfirmContext";

export function useConfirm() {
  const id = useId();
  const { confirm: confirmBase, close } = useContext(ConfirmContext);

  const confirm = useCallback(
    (params: ConfirmParams) => {
      return confirmBase(id, params);
    },
    [id, confirmBase],
  );

  useEffect(() => {
    return () => {
      close(id);
    };
  }, [close, id]);

  return confirm;
}
