import {
  toColorScheme,
  toThemeChoice,
} from "providers/ThemeProvider/themeChoices";

import { ThemeDialog } from "ui/game/ThemeDialog";

import { useAppThemeStore } from "stores/appTheme.store";
import { useUID } from "stores/auth.store";

export interface AppThemeDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Change Theme outside a game: only the Everywhere row. */
export function AppThemeDialog(props: AppThemeDialogProps) {
  const { open, onClose } = props;
  const appTheme = useAppThemeStore((store) => store.appTheme);
  const setAppTheme = useAppThemeStore((store) => store.setAppTheme);
  const uid = useUID();

  return (
    <ThemeDialog
      open={open}
      onClose={onClose}
      characters={[]}
      appTheme={toThemeChoice(appTheme)}
      initialOpen={{ kind: "app" }}
      onSave={async (changes) => {
        for (const { target, theme } of changes) {
          if (target.kind === "app") {
            await setAppTheme(uid, toColorScheme(theme));
          }
        }
      }}
    />
  );
}
