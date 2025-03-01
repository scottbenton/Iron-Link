import { StorageApiError } from "@supabase/storage-js";
import { isAuthError } from "@supabase/supabase-js";
// import { parseRepositoryErrorAndCreateSnackbar } from "@/providers/SnackbarProvider";

export enum ErrorNoun {
  Asset = "asset",
  Character = "character",
  Game = "game",
  GameInviteKey = "game invite key",
  GameLog = "game log",
  GamePlayers = "game players",
  NoteFolders = "note folders",
  Note = "note",
  SecondScreen = "second screen settings",
  Tracks = "tracks",
  User = "user",
  Image = "image",
}

export enum ErrorVerb {
  Create = "create",
  Read = "read",
  Update = "update",
  Delete = "delete",
  Upload = "upload",
}

export enum ErrorReason {
  BadRequest = "BAD_REQUEST",
  NotAuthorized = "NOT_AUTHORIZED",
  Forbidden = "FORBIDDEN",
  NotFound = "NOT_FOUND",
  TimedOut = "TIMED_OUT",
  RateLimited = "RATE_LIMITED",
  ServerError = "SERVER_ERROR",
  Unknown = "UNKNOWN",
}

export class RepositoryError extends Error {
  originalMessage?: string;
  reason: ErrorReason;
  verb: ErrorVerb;
  noun: ErrorNoun;
  plural: boolean;

  constructor(
    reason: ErrorReason,
    verb: ErrorVerb,
    noun: ErrorNoun,
    plural: boolean,
    originalMessage?: string,
  ) {
    super(`Failed to ${verb} ${noun}: ${reason}`);
    this.name = this.constructor.name;
    this.reason = reason;
    this.verb = verb;
    this.noun = noun;
    this.plural = plural;
    this.originalMessage = originalMessage;
  }
}

export function getRepositoryError(
  error: unknown,
  verb: ErrorVerb,
  noun: ErrorNoun,
  plural: boolean,
  status?: number,
): RepositoryError {
  let reason = ErrorReason.Unknown;
  let message: string | undefined;

  if (status) {
    reason = convertHttpStatusCodeToErrorReason(status);
  }

  if (isAuthError(error) || error instanceof StorageApiError) {
    if (error.status) {
      reason = convertHttpStatusCodeToErrorReason(error.status);
    }
  }

  if (error instanceof Error) {
    message = error.message;
  }
  if (typeof error === "string") {
    message = error;
  }
  if (Array.isArray(error)) {
    message = error.join(", ");
  }

  const repositoryError = new RepositoryError(
    reason,
    verb,
    noun,
    plural,
    message,
  );

  // parseRepositoryErrorAndCreateSnackbar(repositoryError);

  return repositoryError;
}

export function convertHttpStatusCodeToErrorReason(code: number): ErrorReason {
  if (code === 400) {
    return ErrorReason.BadRequest;
  } else if (code === 401) {
    return ErrorReason.NotAuthorized;
  } else if (code === 403) {
    return ErrorReason.Forbidden;
  } else if (code === 404) {
    return ErrorReason.NotFound;
  } else if (code === 408 || code === 504) {
    return ErrorReason.TimedOut;
  } else if (code === 429) {
    return ErrorReason.RateLimited;
  } else if (code === 500) {
    return ErrorReason.ServerError;
  } else {
    return ErrorReason.Unknown;
  }
}
