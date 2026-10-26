import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from "lib/supabase.lib";

import {
  ErrorNoun,
  ErrorVerb,
  getRepositoryError,
} from "./errors/RepositoryErrors";

// A Yjs document stored in a bytea column, versioned by its row's updated_at,
// or for a world's Notes by notes_updated_at.
export type RichTextContentTarget =
  | { table: "notes"; column: "note_content_bytes" }
  | { table: "world_entries"; column: "notes_content" }
  | { table: "worlds"; column: "notes_content" };

// Guides edit a world's Notes but may not update the world, so its Notes are
// written through this RPC; see 20261026020000_world_notes_versions.sql.
const WORLD_NOTES_RPC = "update_world_notes_if_unchanged";

export interface RichTextContentDTO {
  content: string | null;
  updatedAt: string;
}

function getNoun(target: RichTextContentTarget) {
  switch (target.table) {
    case "notes":
      return ErrorNoun.Note;
    case "world_entries":
      return ErrorNoun.WorldEntry;
    case "worlds":
      return ErrorNoun.World;
  }
}

function getVersionColumn(target: RichTextContentTarget) {
  return target.table === "worlds" ? "notes_updated_at" : "updated_at";
}

function getWorldNotesArgs(
  id: string,
  values: Record<string, string>,
  expectedUpdatedAt: string,
) {
  return {
    p_world_id: id,
    p_notes_content: values.notes_content,
    p_expected_updated_at: expectedUpdatedAt,
  };
}

export class RichTextContentRepository {
  // Reads the content only when its version is not `knownUpdatedAt`, so an
  // unchanged document costs a timestamp rather than its whole state.
  public static async read(
    target: RichTextContentTarget,
    id: string,
    knownUpdatedAt: string | undefined,
  ): Promise<RichTextContentDTO | { updatedAt: string; unchanged: true }> {
    const versionColumn = getVersionColumn(target);
    if (knownUpdatedAt) {
      const { data, error, status } = await supabase
        .from(target.table as "notes")
        .select(versionColumn as "updated_at")
        .eq("id", id)
        .single();
      if (error) {
        console.error(error);
        throw getRepositoryError(
          error,
          ErrorVerb.Read,
          getNoun(target),
          false,
          status,
        );
      }
      if (data.updated_at === knownUpdatedAt) {
        return { updatedAt: data.updated_at, unchanged: true };
      }
    }
    const { data, error, status } = await supabase
      .from(target.table)
      .select(`${target.column}, ${versionColumn}`)
      .eq("id", id)
      .single();
    if (error) {
      console.error(error);
      throw getRepositoryError(
        error,
        ErrorVerb.Read,
        getNoun(target),
        false,
        status,
      );
    }
    const row = data as unknown as Record<string, string | null>;
    return {
      content: row[target.column],
      updatedAt: row[versionColumn] as string,
    };
  }

  // Writes only if the row is still at `expectedUpdatedAt`. Resolves the new
  // version, or null when someone else saved first (or the write was refused).
  public static async writeIfUnchanged(
    target: RichTextContentTarget,
    id: string,
    values: Record<string, string>,
    expectedUpdatedAt: string,
  ): Promise<string | null> {
    if (target.table === "worlds") {
      const { data, error, status } = await supabase.rpc(
        WORLD_NOTES_RPC,
        getWorldNotesArgs(id, values, expectedUpdatedAt),
      );
      if (error) {
        console.error(error);
        throw getRepositoryError(
          error,
          ErrorVerb.Update,
          getNoun(target),
          false,
          status,
        );
      }
      return data ?? null;
    }
    const { data, error, status } = await supabase
      .from(target.table)
      .update(values)
      .eq("id", id)
      .eq("updated_at", expectedUpdatedAt)
      .select("updated_at");
    if (error) {
      console.error(error);
      throw getRepositoryError(
        error,
        ErrorVerb.Update,
        getNoun(target),
        false,
        status,
      );
    }
    return data[0]?.updated_at ?? null;
  }

  // The same guarded write as a keepalive request, which can outlive the page.
  // Its outcome is never read, so a clash leaves the edits unsaved.
  public static writeIfUnchangedBeacon(
    token: string,
    target: RichTextContentTarget,
    id: string,
    values: Record<string, string>,
    expectedUpdatedAt: string,
  ): void {
    const isWorld = target.table === "worlds";
    const endpoint = isWorld
      ? `${SUPABASE_URL}/rest/v1/rpc/${WORLD_NOTES_RPC}`
      : `${SUPABASE_URL}/rest/v1/${target.table}?id=eq.${id}` +
        `&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`;
    fetch(endpoint, {
      method: isWorld ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Prefer: "return=minimal",
        Apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(
        isWorld ? getWorldNotesArgs(id, values, expectedUpdatedAt) : values,
      ),
      keepalive: true,
    }).catch((e) => console.error(e));
  }
}
