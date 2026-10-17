import { byteaToUint8Array, uint8ArrayToBytea } from "lib/bytea.lib";

import {
  RichTextContentRepository,
  RichTextContentTarget,
} from "repositories/richTextContent.repository";

// Where a rich text editor reads and writes its document. Saves go through
// `saveMergedRichText`, so neither method ever overwrites someone's edits.
export interface RichTextContentStore {
  // The stored state and its version. `content` is left out when the version
  // is still `knownUpdatedAt`, or when nothing has been saved yet.
  read(
    knownUpdatedAt: string | undefined,
  ): Promise<{ updatedAt: string; content?: Uint8Array }>;
  // Resolves the new version, or null when the stored version has moved on.
  write(
    content: Uint8Array,
    text: string,
    expectedUpdatedAt: string,
  ): Promise<string | null>;
  // A guarded write that can outlive the page, for saving on unload.
  writeBeacon(
    content: Uint8Array,
    text: string,
    expectedUpdatedAt: string,
  ): void;
}

export class RichTextContentService {
  public static createStore(
    target: RichTextContentTarget,
    id: string,
    getToken: () => string | undefined,
    // Columns written beside the content, such as a note's searchable text.
    getExtraValues: (text: string) => Record<string, string> = () => ({}),
  ): RichTextContentStore {
    const getValues = (content: Uint8Array, text: string) => ({
      ...getExtraValues(text),
      [target.column]: uint8ArrayToBytea(content),
    });
    return {
      read: async (knownUpdatedAt) => {
        const stored = await RichTextContentRepository.read(
          target,
          id,
          knownUpdatedAt,
        );
        if ("unchanged" in stored || !stored.content) {
          return { updatedAt: stored.updatedAt };
        }
        return {
          updatedAt: stored.updatedAt,
          content: byteaToUint8Array(stored.content),
        };
      },
      write: (content, text, expectedUpdatedAt) =>
        RichTextContentRepository.writeIfUnchanged(
          target,
          id,
          getValues(content, text),
          expectedUpdatedAt,
        ),
      writeBeacon: (content, text, expectedUpdatedAt) => {
        const token = getToken();
        if (!token) return;
        RichTextContentRepository.writeIfUnchangedBeacon(
          token,
          target,
          id,
          getValues(content, text),
          expectedUpdatedAt,
        );
      },
    };
  }
}
