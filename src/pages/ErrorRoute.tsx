import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouteError } from "react-router";

import { EmptyState } from "components/Layout/EmptyState";

const supportEmail = "scott@scottbenton.dev";

export function ErrorRoute() {
  const error = useRouteError();
  const [errorMessage, setErrorMessage] = useState<string>();
  const { t } = useTranslation();

  useEffect(() => {
    let errorMessage: string | undefined = undefined;
    let errorTrace: string | undefined = undefined;

    if (typeof error === "string") {
      errorMessage = error;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorTrace = error.stack;
    }

    // The App has updated in the background, lets grab the new versions of the pages by refreshing
    if (
      errorMessage?.includes("Failed to fetch dynamically imported module") ||
      errorMessage?.includes(
        "'text/html' is not a valid JavaScript MIME type.",
      ) ||
      errorMessage?.includes("Importing a module script failed.") ||
      errorMessage
        ?.toLocaleLowerCase()
        .includes("error loading dynamically imported module")
    ) {
      // This is due to a new version of the app being deployed, so we need to refresh the page
      window.location.reload();
    } else {
      setErrorMessage(errorMessage);
      console.error(
        "Error Route Error: ",
        errorMessage,
        errorTrace,
        location.pathname,
      );
      // reportPageError(
      //   errorMessage ?? "Could not extract error message.",
      //   errorTrace,
      //   location.pathname
      // );
    }
  }, [error]);

  return (
    <EmptyState
      title={t("layout.error.title", "Iron Link encountered an error")}
      message={
        <>
          <Typography>
            {t(
              "layout.error.message-instructions",
              "Sorry for the inconvenience. If you are having trouble accessing the app, please reach out to me on the discord, or by emailing {{supportEmail}} with a description of the error.",
              { supportEmail },
            )}
          </Typography>
          {errorMessage && (
            <Typography display={"block"}>
              {t(
                "layout.error.message",
                "Please include the following in your message: ",
              )}
              {errorMessage}
            </Typography>
          )}
        </>
      }
    />
  );
}
