import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "ui/components/Table";
import { VisuallyHidden } from "ui/components/VisuallyHidden";

import { ModifierKeys } from "stores/accessibility.store";

import { getKeybindActions } from "./keybindActions";

export interface KeybindingsTableProps {
  modifierKey: ModifierKeys | undefined;
  keybinds: Record<string, string | undefined>;
  listeningFor: string | undefined;
  onListen: (actionKey: string) => void;
  labelId: string;
}

/** Each focus shortcut, its key and a button that listens for a new one. */
export function KeybindingsTable(props: KeybindingsTableProps) {
  const { modifierKey, keybinds, listeningFor, onListen, labelId } = props;
  const { t } = useTranslation();

  const none = t("a11y.no-key", "None");

  return (
    <Table aria-labelledby={labelId}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t("a11y.action", "Action")}</TableHeaderCell>
          <TableHeaderCell>{t("a11y.key", "Key")}</TableHeaderCell>
          <TableHeaderCell>
            <VisuallyHidden>{t("a11y.change-key", "Change")}</VisuallyHidden>
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {getKeybindActions(t).map((action) => {
          const key = keybinds[action.key] ?? none;
          return (
            <TableRow key={action.key}>
              <TableCell>{action.label}</TableCell>
              <TableCell>
                {modifierKey ? `${modifierKey} + ${key}` : key}
              </TableCell>
              <TableCell>
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => onListen(action.key)}
                >
                  {action.key === listeningFor
                    ? t("a11y.current-key-setting", "Listening")
                    : t("a11y.set-key", "Set")}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
