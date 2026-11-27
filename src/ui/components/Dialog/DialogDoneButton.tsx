import { useTranslation } from "react-i18next";

import { Button, ButtonProps } from "../Button";
import { DialogClose } from "./DialogClose";

export interface DialogDoneButtonProps {
  /** Primary unless another button in the strip is the main action. */
  variant?: ButtonProps["variant"];
  /** Defaults to "Done". */
  label?: string;
}

/** Closes the dialog. Goes last in `DialogActions`, or before the main action. */
export function DialogDoneButton(props: DialogDoneButtonProps) {
  const { t } = useTranslation();
  const { variant = "primary", label = t("ui.common.done", "Done") } = props;
  return (
    <DialogClose
      render={
        <Button type="button" variant={variant}>
          {label}
        </Button>
      }
    />
  );
}
