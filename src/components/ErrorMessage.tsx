import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { SUPPORT_EMAIL } from "lib/support.lib";

import { PageContent } from "./Layout";
import { EmptyState } from "./Layout/EmptyState";

export interface ErrorMessageProps {
  message?: string;
}

export function ErrorMessage(props: ErrorMessageProps) {
  const { message } = props;

  const { t } = useTranslation();

  return (
    <PageContent>
      <Box pt={8} mx="auto" maxWidth={"sm"}>
        <EmptyState
          title={t("layout.error.title", "Iron Link Crashed")}
          message={
            <>
              <Typography mt={3}>
                {t(
                  "layout.error.message-instructions",
                  "Sorry for the inconvenience. If you are having trouble accessing the app, please reach out to me on the discord, or by emailing {{supportEmail}} with a description of the error.",
                  { supportEmail: SUPPORT_EMAIL },
                )}
              </Typography>
              {message && (
                <Typography display={"block"} mt={1}>
                  {t(
                    "layout.error.message",
                    "Please include the following in your message: ",
                  )}
                  {message}
                </Typography>
              )}
            </>
          }
        />
      </Box>
    </PageContent>
  );
}
