import { FormEvent } from "react";

// Dialog slotProps that make the dialog's paper a form, so Enter in a field
// submits it while the title, scrolling content and actions keep their layout.
// Give the dialog's main button type="submit". noValidate leaves errors to the
// dialog's own messages instead of the browser's.
export function getDialogFormSlotProps(onSubmit: (evt: FormEvent) => void) {
  return {
    paper: {
      component: "form" as const,
      noValidate: true,
      onSubmit,
    },
  };
}
