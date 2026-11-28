import { useTranslation } from "react-i18next";

import { useConfirm } from "ui/components/ConfirmDialog";
import { ToolbarButton } from "ui/components/Toolbar";
import { EyeSlashIcon, LockIcon } from "ui/icons";

import type { SecretsToolbarState } from "../richTextToolbar";

export interface SecretToolbarButtonProps {
  secrets: SecretsToolbarState;
}

// Insert secret, for Guides: adds an empty block at the caret.
export function InsertSecretButton(props: SecretToolbarButtonProps) {
  const { secrets } = props;
  const { t } = useTranslation();

  return (
    <ToolbarButton
      label={t("notes.secrets.insert", "Insert secret")}
      icon={<LockIcon />}
      // Keep the caret in the note.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => secrets.insertSecret()}
    />
  );
}

// Make secret, for Guides: moves the selected text into a new block, after
// warning that players may already have seen it.
export function MakeSecretButton(props: SecretToolbarButtonProps) {
  const { secrets } = props;
  const { t } = useTranslation();
  const confirm = useConfirm();
  const label = t("notes.secrets.make", "Make secret");

  const handleClick = async () => {
    const { confirmed } = await confirm({
      title: label,
      description: t(
        "notes.secrets.make-warning",
        "Players may already have seen this. The text moves into a secret only Guides can read, but anyone who opened the note before now has already seen it. Images are copied into private storage, but the originals stay where they were, so anyone with their old links can still open them.",
      ),
      confirmationText: label,
    });
    if (confirmed) secrets.makeSecret();
  };

  return (
    <ToolbarButton
      label={label}
      icon={<EyeSlashIcon />}
      // Keep the selection in the note while the dialog opens.
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleClick}
    />
  );
}
