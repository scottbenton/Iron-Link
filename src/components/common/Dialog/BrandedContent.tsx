import { DialogContent } from "@/components/ui/dialog";
import { colorSchemeMap } from "@/providers/ThemeProvider/config";
import { Theme, useAppState } from "@/stores/appState.store";
import { PropsWithChildren, useState } from "react";

import { DialogContentRefContext } from "./DialogContentRefContext";

export function BrandedContent(props: PropsWithChildren) {
  const { children } = props;
  const theme = useAppState((state) => state.theme);
  const colorScheme = useAppState((state) => state.colorScheme);

  const [dialogContentRef, setDialogContentRef] =
    useState<HTMLDivElement | null>(null);

  return (
    <DialogContent
      ref={setDialogContentRef}
      appearance={theme === Theme.Light ? "light" : "dark"}
      colorPalette={colorSchemeMap[colorScheme]}
    >
      <DialogContentRefContext.Provider
        value={{
          ref: dialogContentRef ? { current: dialogContentRef } : null,
        }}
      >
        {children}
      </DialogContentRefContext.Provider>
    </DialogContent>
  );
}
