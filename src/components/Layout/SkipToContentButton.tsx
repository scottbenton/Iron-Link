import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";

export const MAIN_CONTENT_ID = "main-content";

export function SkipToContentButton() {
  const { t } = useTranslation();

  return (
    <Button
      LinkComponent={"a"}
      variant={"contained"}
      color={"primary"}
      href={`#${MAIN_CONTENT_ID}`}
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        transform: "translate(-100%)",
        zIndex: 1000,
        "&:focus": {
          transform: "translate(0%)",
        },
      }}
    >
      {t("nav.skip-to-content", "Skip to Content")}
    </Button>
  );
}
