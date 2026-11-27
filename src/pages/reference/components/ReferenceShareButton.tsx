import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { Button } from "ui/components/Button";
import { LinkIcon, ShareNetworkIcon } from "ui/icons";

import { useIsTouchDevice } from "hooks/useIsTouchDevice";

export interface ReferenceShareButtonProps {
  // An app path, such as /reference/starforged/moves/adventure/face_danger.
  path: string;
  name: string;
}

function hasShareSheet(): boolean {
  return (
    typeof navigator !== "undefined" && typeof navigator.share === "function"
  );
}

// Copies a link to a reference item. On touch devices with a system share
// sheet, it opens the sheet instead, falling back to copying.
export function ReferenceShareButton(props: ReferenceShareButtonProps) {
  const { path, name } = props;
  const { t } = useTranslation();
  const { success, error } = useSnackbar();

  const isTouchDevice = useIsTouchDevice();
  const useShareSheet = isTouchDevice && hasShareSheet();
  const url = window.location.origin + path;

  const copy = () => {
    navigator.clipboard
      .writeText(url)
      .then(() =>
        success(
          t("reference.share.copied", "Link to {{name}} copied", { name }),
        ),
      )
      .catch(() =>
        error(t("reference.share.copy-failed", "Couldn't copy the link")),
      );
  };

  const handleClick = () => {
    if (useShareSheet) {
      navigator
        .share({
          title: t("reference.share.title", "{{name}} · Iron Link", { name }),
          url,
        })
        .catch((e: unknown) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          copy();
        });
    } else {
      copy();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      startIcon={useShareSheet ? <ShareNetworkIcon /> : <LinkIcon />}
      onClick={handleClick}
    >
      {useShareSheet
        ? t("reference.share.share", "Share")
        : t("reference.share.copy-link", "Copy link")}
    </Button>
  );
}
