import * as Y from "yjs";

import { addSecretBlock } from "components/RichTextEditor/secrets/secretsDocument";

// One Long text field value on an entry (#257), in field order.
export interface LongTextValue {
  label: string;
  // The value's Yjs document, as stored.
  content: Uint8Array;
  // From a Guide only field: it becomes a secret block, never shared Notes.
  guideOnly: boolean;
}

// The fragment every rich text document here is edited through.
const FIELD = "default";

type Child = Y.XmlElement | Y.XmlText;

function readChildren(content: Uint8Array): Child[] {
  if (content.length === 0) return [];
  const doc = new Y.Doc();
  Y.applyUpdate(doc, content);
  return doc
    .getXmlFragment(FIELD)
    .toArray()
    .filter(
      (child): child is Child =>
        child instanceof Y.XmlElement || child instanceof Y.XmlText,
    );
}

// Nothing but empty paragraphs.
function isEmpty(children: Child[]) {
  return children.every(
    (child) =>
      child instanceof Y.XmlElement &&
      child.nodeName === "paragraph" &&
      child.length === 0,
  );
}

function heading(label: string) {
  const element = new Y.XmlElement("heading");
  // ProseMirror's heading level is a number; Yjs types attributes as strings.
  element.setAttribute("level", 2 as unknown as string);
  element.insert(0, [new Y.XmlText(label)]);
  return element;
}

// Appends each non-empty value to the entry's Notes under a heading with the
// field's label. A Guide only value goes into a secret block of the Notes'
// companion document instead, placed where it would have been. Copies the
// Yjs nodes as they are, so mentions, images and marks come along. Merges
// with whatever the documents hold, like any edit.
export function moveLongTextIntoNotes(params: {
  notes: Y.Doc;
  // Required when any value is Guide only.
  companion: Y.Doc | null;
  values: LongTextValue[];
  createId?: () => string;
  now?: number;
}): { shared: number; secrets: number } {
  const {
    notes,
    companion,
    values,
    createId = () => crypto.randomUUID(),
    now = Date.now(),
  } = params;
  const fragment = notes.getXmlFragment(FIELD);
  let shared = 0;
  let secrets = 0;

  values.forEach((value) => {
    const children = readChildren(value.content);
    if (isEmpty(children)) return;
    const copies = [heading(value.label), ...children.map((c) => c.clone())];

    if (value.guideOnly) {
      if (!companion) {
        throw new Error("A Guide only value needs the companion document");
      }
      addSecretBlock(companion, {
        id: createId(),
        shared: fragment,
        index: fragment.length,
        createdBy: undefined,
        // Later values sort after earlier ones at the same place.
        createdAt: now + secrets,
        fill: (block) => block.insert(0, copies),
      });
      secrets++;
    } else {
      notes.transact(() => fragment.insert(fragment.length, copies));
      shared++;
    }
  });

  return { shared, secrets };
}
