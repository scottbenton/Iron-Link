import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "ui/components/Alert";
import { Button } from "ui/components/Button";
import { Dialog, DialogBody, DialogHeader } from "ui/components/Dialog";
import { Text } from "ui/components/Text";
import { TextField } from "ui/components/TextField";
import { Stack } from "ui/primitives";

import { useAdminStore } from "stores/admin.store";

export interface AdminDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AdminDialog(props: AdminDialogProps) {
  const { open, onClose } = props;

  const { t } = useTranslation();
  const getMagicLink = useAdminStore((state) => state.getMagicLink);

  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetLink = () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    getMagicLink(uid || undefined, email || undefined)
      .then((link) => setMagicLink(link))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <Dialog open={open} onClose={onClose} onSubmit={handleGetLink}>
      <DialogHeader title={t("admin.title", "Admin Actions")} />
      <DialogBody>
        <Stack gap="4">
          <Text variant="h3" as="h3">
            {t("admin.get-magic-link", "Get Magic Link")}
          </Text>
          {error && <Alert tone="danger">{error}</Alert>}
          <TextField
            label={t("admin.uid", "UID")}
            value={uid}
            onValueChange={setUid}
          />
          <TextField
            label={t("admin.email", "Email")}
            value={email}
            onValueChange={setEmail}
          />
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            loadingLabel={t("admin.getting-magic-link", "Getting Magic Link")}
          >
            {t("admin.get-magic-link", "Get Magic Link")}
          </Button>
          {magicLink && (
            <Text css={{ wordBreak: "break-all" }}>
              {t("admin.magic-link", "Magic Link: {{link}}", {
                link: magicLink,
              })}
            </Text>
          )}
        </Stack>
      </DialogBody>
    </Dialog>
  );
}
