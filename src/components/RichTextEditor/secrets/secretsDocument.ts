import * as Y from "yjs";

import {
  SecretAnchor,
  createSecretAnchor,
  isSecretAnchorStale,
  resolveSecretAnchor,
} from "./secretAnchors";

// The companion document of a surface's Guide-only secrets (#253):
//   Y.Map "blocks": blockId -> Y.Map { anchor, createdAt, createdBy, deletedAt }
//   XmlFragment "<blockId>": the block's rich text, one per block
// The shared note holds nothing about secrets.
export type SecretBlockMeta = Y.Map<unknown>;

const BLOCKS = "blocks";

// Local edits made outside a block's editor (inserting, deleting), which the
// secrets undo stack tracks.
export const secretsEditOrigin = { secretsEdit: true };
// Anchor refreshes, which follow the shared note and are never undone.
export const secretsAnchorOrigin = { secretsAnchor: true };

export function getSecretBlocks(doc: Y.Doc) {
  return doc.getMap<SecretBlockMeta>(BLOCKS);
}

export function getSecretBlockFragment(doc: Y.Doc, blockId: string) {
  return doc.getXmlFragment(blockId);
}

export function readSecretAnchor(meta: SecretBlockMeta): SecretAnchor | null {
  const anchor = meta.get("anchor") as Partial<SecretAnchor> | undefined;
  if (!anchor || typeof anchor.fallback !== "number") return null;
  return {
    above: Array.isArray(anchor.above) ? anchor.above : [],
    below: Array.isArray(anchor.below) ? anchor.below : [],
    fallback: anchor.fallback,
  };
}

export function addSecretBlock(
  doc: Y.Doc,
  params: {
    id: string;
    shared: Y.XmlFragment;
    index: number;
    createdBy: string | undefined;
    createdAt?: number;
    // Fills the block's fragment, inside the same transaction.
    fill?: (fragment: Y.XmlFragment) => void;
  },
) {
  const { id, shared, index, createdBy, createdAt = Date.now(), fill } = params;
  doc.transact(() => {
    const meta = new Y.Map<unknown>();
    meta.set("anchor", createSecretAnchor(shared, index));
    meta.set("createdAt", createdAt);
    if (createdBy) meta.set("createdBy", createdBy);
    getSecretBlocks(doc).set(id, meta);
    fill?.(getSecretBlockFragment(doc, id));
  }, secretsEditOrigin);
}

// Marks a block deleted. Its text stays in the document, so undo restores it.
export function deleteSecretBlock(doc: Y.Doc, id: string) {
  const meta = getSecretBlocks(doc).get(id);
  if (!meta) return;
  doc.transact(() => meta.set("deletedAt", Date.now()), secretsEditOrigin);
}

export interface PlacedSecretBlock {
  id: string;
  // The top-level index of the shared note the block sits before.
  index: number;
}

// Every live block and where it renders, in reading order. Blocks at one
// boundary order by when they were made, then by id. When `refresh` is set,
// anchors whose neighbours changed are rewritten where they resolved, once
// this call returns; only a Guide's editor does that.
export function placeSecretBlocks(
  companion: Y.Doc,
  sharedDoc: Y.Doc,
  shared: Y.XmlFragment,
  options: { refresh?: boolean } = {},
): PlacedSecretBlock[] {
  const placed: (PlacedSecretBlock & { createdAt: number })[] = [];
  const stale: { meta: SecretBlockMeta; index: number }[] = [];
  getSecretBlocks(companion).forEach((meta, id) => {
    if (meta.get("deletedAt")) return;
    const anchor = readSecretAnchor(meta);
    const index = anchor
      ? resolveSecretAnchor(sharedDoc, shared, anchor)
      : shared.length;
    const createdAt = meta.get("createdAt");
    placed.push({
      id,
      index,
      createdAt: typeof createdAt === "number" ? createdAt : 0,
    });
    if (
      options.refresh &&
      (!anchor || isSecretAnchorStale(sharedDoc, shared, anchor, index))
    ) {
      stale.push({ meta, index });
    }
  });
  if (stale.length > 0) {
    // Not inside the caller's update: this runs while an editor builds its
    // decorations.
    queueMicrotask(() => {
      if (companion.isDestroyed) return;
      companion.transact(() => {
        stale.forEach(({ meta, index }) => {
          meta.set(
            "anchor",
            createSecretAnchor(shared, Math.min(index, shared.length)),
          );
        });
      }, secretsAnchorOrigin);
    });
  }
  return placed
    .sort(
      (a, b) =>
        a.index - b.index ||
        a.createdAt - b.createdAt ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    )
    .map(({ id, index }) => ({ id, index }));
}

function collectText(node: Y.XmlElement | Y.XmlText | Y.XmlFragment): string {
  if (node instanceof Y.XmlText) return node.toString().replace(/<[^>]*>/g, "");
  if (node instanceof Y.XmlElement && node.nodeName === "mention") {
    const label = node.getAttribute("label");
    return typeof label === "string" ? `@${label}` : "";
  }
  const children = node
    .toArray()
    .filter(
      (child): child is Y.XmlElement | Y.XmlText =>
        child instanceof Y.XmlElement || child instanceof Y.XmlText,
    );
  const inline = children.every((child) => child instanceof Y.XmlText);
  return children.map(collectText).join(inline ? "" : "\n");
}

function liveBlockIds(companion: Y.Doc) {
  const ids: string[] = [];
  getSecretBlocks(companion).forEach((meta, id) => {
    if (!meta.get("deletedAt")) ids.push(id);
  });
  return ids.sort();
}

// The plain text of every live block, for a Guide's search.
export function getSecretsText(companion: Y.Doc) {
  return liveBlockIds(companion)
    .map((id) => collectText(getSecretBlockFragment(companion, id)).trim())
    .filter((text) => text.length > 0)
    .join("\n\n");
}

// What the live blocks mention, written beside them for Guide backlinks.
export function getSecretsMentions(companion: Y.Doc) {
  const notes = new Set<string>();
  const entries = new Set<string>();
  const visit = (node: Y.XmlFragment | Y.XmlElement) => {
    node.toArray().forEach((child) => {
      if (!(child instanceof Y.XmlElement)) return;
      if (child.nodeName === "mention") {
        const id = child.getAttribute("id");
        if (typeof id === "string") {
          if (child.getAttribute("kind") === "worldEntry") entries.add(id);
          else notes.add(id);
        }
      }
      visit(child);
    });
  };
  liveBlockIds(companion).forEach((id) =>
    visit(getSecretBlockFragment(companion, id)),
  );
  return {
    mentioned_note_ids: [...notes].sort(),
    mentioned_entry_ids: [...entries].sort(),
  };
}
