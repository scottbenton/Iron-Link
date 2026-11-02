import * as Y from "yjs";

// Where a secret block sits in the shared note, stored only in the Guide-only
// companion document (spike #252). Blocks sit between top-level nodes of the
// shared note's fragment, so a position is a top-level index.
//
// An anchor names up to ANCHOR_DEPTH neighbours on each side as Yjs relative
// positions: "just after the node above" and "just before the node below",
// nearest first. Typing and edits elsewhere never move a block; deleting or
// retyping a neighbour (which y-prosemirror does by inserting a new node
// before the old one) falls back to the next neighbour, the replacement, the
// gap between survivors, then the stored index. A block is never hidden.
export interface SecretAnchor {
  above: Uint8Array[];
  below: Uint8Array[];
  // The top-level index when the anchor was written.
  fallback: number;
}

export const ANCHOR_DEPTH = 3;

export function createSecretAnchor(
  fragment: Y.XmlFragment,
  index: number,
): SecretAnchor {
  const above: Uint8Array[] = [];
  const below: Uint8Array[] = [];
  for (let k = 0; k < ANCHOR_DEPTH && index - k > 0; k++) {
    above.push(
      Y.encodeRelativePosition(
        Y.createRelativePositionFromTypeIndex(fragment, index - k, -1),
      ),
    );
  }
  for (let k = 0; k < ANCHOR_DEPTH && index + k < fragment.length; k++) {
    below.push(
      Y.encodeRelativePosition(
        Y.createRelativePositionFromTypeIndex(fragment, index + k, 0),
      ),
    );
  }
  return { above, below, fallback: index };
}

type ItemState = "edge" | "missing" | "deleted" | "live";

function getItemState(doc: Y.Doc, rel: Y.RelativePosition): ItemState {
  if (!rel.item) return "edge";
  if (Y.getState(doc.store, rel.item.client) <= rel.item.clock) {
    return "missing";
  }
  return Y.getItem(doc.store, rel.item).deleted ? "deleted" : "live";
}

function getIndex(doc: Y.Doc, fragment: Y.XmlFragment, bytes: Uint8Array) {
  const abs = Y.createAbsolutePositionFromRelativePosition(
    Y.decodeRelativePosition(bytes),
    doc,
  );
  return abs && abs.type === fragment ? abs.index : null;
}

// The nearest neighbour in `list` that is still there, and how far it was.
function findLive(doc: Y.Doc, fragment: Y.XmlFragment, list: Uint8Array[]) {
  for (let k = 0; k < list.length; k++) {
    if (getItemState(doc, Y.decodeRelativePosition(list[k])) !== "live") {
      continue;
    }
    const index = getIndex(doc, fragment, list[k]);
    if (index !== null) return { k, index };
  }
  return null;
}

type FragmentInternals = { _start: Y.Item | null };

// y-prosemirror replaces a retyped node by inserting the new one directly
// before the old, so the replacement's right origin is the deleted item.
function findReplacement(fragment: Y.XmlFragment, id: Y.ID) {
  let target: Y.ID | null = id;
  for (let hops = 0; target && hops < 50; hops++) {
    let found: Y.Item | null = null;
    let item = (fragment as unknown as FragmentInternals)._start;
    while (item) {
      const origin = item.rightOrigin;
      if (
        origin &&
        origin.client === target.client &&
        origin.clock === target.clock
      ) {
        found = item;
        if (!item.deleted) break;
      }
      item = item.right;
    }
    if (!found) return null;
    if (!found.deleted) return found;
    target = found.id;
  }
  return null;
}

function getLiveIndex(fragment: Y.XmlFragment, target: Y.Item) {
  let index = 0;
  let item = (fragment as unknown as FragmentInternals)._start;
  while (item && item !== target) {
    if (!item.deleted && item.countable) index += item.length;
    item = item.right;
  }
  return item ? index : null;
}

function findReplacementIndex(
  doc: Y.Doc,
  fragment: Y.XmlFragment,
  bytes: Uint8Array | undefined,
  after: boolean,
) {
  if (!bytes) return null;
  const rel = Y.decodeRelativePosition(bytes);
  if (!rel.item || getItemState(doc, rel) !== "deleted") return null;
  const deleted = Y.getItem(doc.store, rel.item) as Y.Item;
  const replacement = findReplacement(fragment, deleted.id);
  if (!replacement) return null;
  const index = getLiveIndex(fragment, replacement);
  return index === null ? null : after ? index + 1 : index;
}

// The top-level index a block renders at. Always resolves to somewhere in the
// note, so a secret is never hidden from a Guide.
export function resolveSecretAnchor(
  doc: Y.Doc,
  fragment: Y.XmlFragment,
  anchor: SecretAnchor,
): number {
  const length = fragment.length;
  const below = findLive(doc, fragment, anchor.below);
  const above = findLive(doc, fragment, anchor.above);
  if (below?.k === 0) return below.index;
  if (above?.k === 0) return above.index;
  // Placed at the very start or end, and nothing on that side was kept.
  if (anchor.above.length === 0 && !above) return 0;
  if (anchor.below.length === 0 && !below && !above) return length;

  const replacedBelow = findReplacementIndex(
    doc,
    fragment,
    anchor.below[0],
    false,
  );
  if (replacedBelow !== null) return replacedBelow;
  const replacedAbove = findReplacementIndex(
    doc,
    fragment,
    anchor.above[0],
    true,
  );
  if (replacedAbove !== null) return replacedAbove;

  if (above || below) {
    const low = above ? above.index : 0;
    const high = below ? below.index : anchor.below.length === 0 ? low : length;
    // Each lost neighbour above most likely left a node in its place.
    const lostAbove = above ? above.k : anchor.above.length;
    return Math.max(low, Math.min(high, low + lostAbove));
  }
  return Math.min(anchor.fallback, length);
}

// True when a Guide's editor should write a fresh anchor at `index`: the
// nearest neighbours were deleted or are no longer either side of the block.
// A neighbour this copy of the note hasn't received yet is not a reason; the
// anchor may resolve once it arrives.
export function isSecretAnchorStale(
  doc: Y.Doc,
  fragment: Y.XmlFragment,
  anchor: SecretAnchor,
  index: number,
): boolean {
  const read = (bytes: Uint8Array | undefined) => {
    if (!bytes) return "none" as const;
    const state = getItemState(doc, Y.decodeRelativePosition(bytes));
    if (state === "missing") return "missing" as const;
    if (state === "deleted") return "dead" as const;
    return getIndex(doc, fragment, bytes) ?? ("dead" as const);
  };
  const above = read(anchor.above[0]);
  const below = read(anchor.below[0]);
  if (above === "missing" || below === "missing") return false;
  if (above === "dead" || below === "dead") return true;
  if (above === "none" && index > 0) return true;
  if (below === "none" && index < fragment.length) return true;
  return (
    (above !== "none" && above !== index) ||
    (below !== "none" && below !== index)
  );
}

interface TopLevelNodes {
  childCount: number;
  child: (index: number) => { nodeSize: number };
}

// The ProseMirror position of the boundary before top-level node `index`.
export function topLevelIndexToPos(doc: TopLevelNodes, index: number) {
  let pos = 0;
  for (let i = 0; i < Math.min(index, doc.childCount); i++) {
    pos += doc.child(i).nodeSize;
  }
  return pos;
}
