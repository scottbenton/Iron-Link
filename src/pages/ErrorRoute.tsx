import { useEffect, useState } from "react";
import { useRouteError } from "react-router";

import { ErrorMessage } from "components/ErrorMessage";

import { AnalyticsService } from "services/analytics.service";

export function ErrorRoute() {
  const error = useRouteError();
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    let errorMessage: string | undefined = undefined;
    let typedError: Error;

    if (typeof error === "string") {
      errorMessage = error;
      typedError = new Error(error);
    } else if (error instanceof Error) {
      errorMessage = error.message;
      typedError = error;
    } else {
      typedError = new Error(`Unknown error. Type was ${typeof error}`);
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
      console.error("Error Route Error: ", errorMessage, location.pathname);
      AnalyticsService.logError(typedError);
    }
  }, [error]);

  return <ErrorMessage message={errorMessage} />;
}
