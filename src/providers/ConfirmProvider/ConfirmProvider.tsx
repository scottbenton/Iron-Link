import { Dialog } from "@/components/common/Dialog";
import { DialogActionTrigger } from "@/components/ui/dialog";
import { useCommonTranslations } from "@/hooks/i18n/useCommonTranslations";
import { Button, Text } from "@chakra-ui/react";
import { PropsWithChildren, useCallback, useState } from "react";

import { ConfirmContext, ConfirmParams, ConfirmResult } from "./ConfirmContext";

export function ConfirmProvider(props: PropsWithChildren) {
  const { children } = props;
  const t = useCommonTranslations();

  const [open, setOpen] = useState<{
    id: string;
    resolve: (value: ConfirmResult | PromiseLike<ConfirmResult>) => void;
  } | null>(null);
  const [dialogState, setDialogState] = useState<ConfirmParams>();

  const confirm = useCallback((id: string, params: ConfirmParams) => {
    return new Promise<ConfirmResult>((resolve) => {
      setDialogState(params);
      setOpen({
        id,
        resolve,
      });
    });
  }, []);

  const closeOnUnmount = useCallback((id: string) => {
    setOpen((state) => {
      if (state?.id === id) {
        state.resolve({ confirmed: false });
        return null;
      } else {
        return state;
      }
    });
  }, []);

  const handleClose = useCallback(() => {
    setOpen((state) => {
      state?.resolve({ confirmed: false });
      return null;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen((state) => {
      state?.resolve({ confirmed: true });
      return null;
    });
  }, []);

  return (
    <>
      <ConfirmContext
        value={{
          confirm,
          close: closeOnUnmount,
        }}
      >
        {children}
      </ConfirmContext>
      <Dialog
        role="alertdialog"
        open={!!open}
        title={dialogState?.title}
        content={<Text color="fg.muted">{dialogState?.message}</Text>}
        actions={
          <>
            <DialogActionTrigger asChild>
              <Button colorPalette={"gray"} variant="ghost">
                {t("common.cancel", "Cancel")}
              </Button>
            </DialogActionTrigger>
            <Button
              colorPalette={dialogState?.confirmColorPalette ?? "red"}
              onClick={handleConfirm}
            >
              {dialogState?.confirmText ?? t("common.confirm", "Confirm")}
            </Button>
          </>
        }
        onClose={handleClose}
      />
    </>
  );
}
