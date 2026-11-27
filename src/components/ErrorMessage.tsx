import { ElementType } from "react";
import { useTranslation } from "react-i18next";

import { Text } from "ui/components/Text";
import { EmptyState, PageContent } from "ui/layout";
import { Stack } from "ui/primitives";

import { SUPPORT_EMAIL } from "lib/support.lib";

export interface ErrorMessageProps {
  message?: string;
  /**
   * The title's element: `h1` where the crash page is the whole page (the
   * router's error route), a status line inside a page that keeps its own
   * heading.
   */
  titleAs?: ElementType;
}

export function ErrorMessage(props: ErrorMessageProps) {
  const { message, titleAs } = props;

  const { t } = useTranslation();

  return (
    <PageContent maxWidth="sm">
      <EmptyState
        title={t("layout.error.title", "Iron Link Crashed")}
        titleAs={titleAs}
        message={
          <Stack gap="2">
            <Text variant="bodySm" color="muted">
              {t(
                "layout.error.message-instructions",
                "Sorry for the inconvenience. If you are having trouble accessing the app, please reach out to me on the discord, or by emailing {{supportEmail}} with a description of the error.",
                { supportEmail: SUPPORT_EMAIL },
              )}
            </Text>
            {message && (
              <Text variant="bodySm" color="muted">
                {t(
                  "layout.error.message",
                  "Please include the following in your message: ",
                )}
                {message}
              </Text>
            )}
          </Stack>
        }
      />
    </PageContent>
  );
}
