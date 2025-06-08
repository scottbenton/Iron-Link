import { enqueueSnackbar } from "notistack";

import { i18n } from "i18n/config";

import {
  ErrorNoun,
  ErrorReason,
  ErrorVerb,
  RepositoryError,
} from "repositories/errors/RepositoryErrors";

import { AnalyticsService } from "services/analytics.service";

export function createInfoSnackbar(message: string) {
  enqueueSnackbar(message, {
    variant: "info",
  });
}

export function createSuccessSnackbar(message: string) {
  enqueueSnackbar(message, {
    variant: "success",
  });
}
export function createWarningSnackbar(message: string) {
  enqueueSnackbar(message, {
    variant: "warning",
  });
}

export function createErrorSnackbar(message: string) {
  enqueueSnackbar(message, {
    variant: "error",
  });
}

export function parseRepositoryErrorAndGetText(error: RepositoryError) {
  const reason = getTranslatedReason(error.reason);
  const noun = getTranslatedNoun(error.noun, error.plural);
  const verb = getTranslatedVerb(error.verb);
  let errorMessage: string;

  if (reason) {
    errorMessage = i18n.t(
      "errors.parsed-error-message-with-reason",
      "{{reason}}: Failed to {{verb}} {{noun}}",
      {
        reason,
        verb,
        noun,
      },
    );
  } else {
    errorMessage = i18n.t(
      "errors.parsed-error-message",
      "Failed to {{verb}} {{noun}}",
      {
        verb,
        noun,
      },
    );
  }
  return errorMessage;
}

export function parseRepositoryErrorAndCreateSnackbar(error: unknown) {
  if (error instanceof Error) {
    AnalyticsService.logError(error);
  }
  if (error instanceof RepositoryError) {
    createErrorSnackbar(parseRepositoryErrorAndGetText(error));
  } else {
    createErrorSnackbar(i18n.t("errors.generic", "An error occurred"));
  }
}

export function useSnackbar() {
  return {
    info: createInfoSnackbar,
    success: createSuccessSnackbar,
    warning: createWarningSnackbar,
    error: createErrorSnackbar,
  };
}

function getTranslatedReason(reason: ErrorReason): string | undefined {
  switch (reason) {
    case ErrorReason.NotFound:
      return i18n.t("errors.notFound", "Not found");
    case ErrorReason.NotAuthorized:
      return i18n.t("errors.unauthorized", "Unauthorized");
    case ErrorReason.Forbidden:
      return i18n.t("errors.forbidden", "Forbidden");
    case ErrorReason.BadRequest:
      return i18n.t("errors.badRequest", "Bad request");
    case ErrorReason.TimedOut:
      return i18n.t("errors.timedOut", "Timeout Reached");
    case ErrorReason.RateLimited:
      return i18n.t("errors.rateLimited", "Rate limited");
    case ErrorReason.ServerError:
      return i18n.t("errors.serverError", "Server Error");
    default:
      return undefined;
  }
}

function getTranslatedNoun(noun: ErrorNoun, plural: boolean): string {
  switch (noun) {
    case ErrorNoun.Asset:
      return plural
        ? i18n.t("errors.assets", "assets")
        : i18n.t("errors.asset", "asset");
    case ErrorNoun.Character:
      return plural
        ? i18n.t("errors.characters", "characters")
        : i18n.t("errors.character", "character");
    case ErrorNoun.Game:
      return plural
        ? i18n.t("errors.games", "games")
        : i18n.t("errors.game", "game");
    case ErrorNoun.GameLog:
      return plural
        ? i18n.t("errors.gameLogs", "logs")
        : i18n.t("errors.gameLog", "log");
    case ErrorNoun.GamePlayers:
      return plural
        ? i18n.t("errors.gamePlayers", "players")
        : i18n.t("errors.gamePlayer", "player");
    case ErrorNoun.NoteFolders:
      return plural
        ? i18n.t("errors.noteFolders", "folders")
        : i18n.t("errors.noteFolder", "folder");
    case ErrorNoun.Note:
      return plural
        ? i18n.t("errors.notes", "notes")
        : i18n.t("errors.note", "note");
    case ErrorNoun.SecondScreen:
      return i18n.t("errors.secondScreenSettings", "second screen settings");
    case ErrorNoun.Tracks:
      return plural
        ? i18n.t("errors.tracks", "tracks")
        : i18n.t("errors.track", "track");
    case ErrorNoun.User:
      return plural
        ? i18n.t("errors.users", "users")
        : i18n.t("errors.user", "user");
    case ErrorNoun.Image:
      return plural
        ? i18n.t("errors.images", "images")
        : i18n.t("errors.image", "image");
    case ErrorNoun.GameInviteKey:
      return plural
        ? i18n.t("errors.gameInviteKeys", "game invite keys")
        : i18n.t("errors.gameInviteKey", "game invite key");
    case ErrorNoun.World:
      return plural
        ? i18n.t("errors.worlds", "worlds")
        : i18n.t("errors.world", "world");
    case ErrorNoun.WorldPlayer:
      return plural
        ? i18n.t("errors.worldPlayers", "players")
        : i18n.t("errors.worldPlayer", "player");
    default:
      return "";
  }
}

function getTranslatedVerb(verb: ErrorVerb): string {
  switch (verb) {
    case ErrorVerb.Create:
      return i18n.t("errors.create", "create");
    case ErrorVerb.Read:
      return i18n.t("errors.read", "read");
    case ErrorVerb.Update:
      return i18n.t("errors.update", "update");
    case ErrorVerb.Delete:
      return i18n.t("errors.delete", "delete");
    case ErrorVerb.Upload:
      return i18n.t("errors.upload", "upload");
    default:
      return "";
  }
}
