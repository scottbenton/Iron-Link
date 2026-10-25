import deepEqual from "fast-deep-equal";

import type {
  IWorldEntryFieldValue,
  WorldFieldValue,
} from "services/worldEntryFieldValues.service";

// How long a settled write waits for its realtime change before this window
// stops holding the field, in case the change never arrives.
export const FIELD_WRITE_ECHO_TIMEOUT_MS = 10000;

// Saves one window's changes to a field value in order, one request at a time,
// and keeps the field showing the newest of them until realtime catches up.
//
// Without it, quick changes (rolling a field again and again) race: each save
// is its own request, so they may commit out of order, and each one's
// realtime change arrives after newer ones were made, so the field jumps back
// through older values. Here a change made while a save is in flight waits
// and replaces any change already waiting, so only the newest is sent next.
// Realtime delivers changes in commit order, so every change that arrives
// before this window's last save's own was committed before that save and is
// overwritten by it: those are skipped. Changes after it, other people's
// included, show as usual.
//
// `null` deletes the value.

interface Waiter {
  resolve: () => void;
  reject: (cause: unknown) => void;
}

interface FieldWrites {
  // The newest change this window made.
  latest: WorldFieldValue | null;
  // A save sent and not settled.
  inFlight: boolean;
  // The newest change made while a save was in flight, and every caller
  // waiting on it or on a change it replaced.
  queued?: { value: WorldFieldValue | null; waiters: Waiter[] };
  // Sent saves whose realtime change has not arrived, oldest first.
  owed: { value: WorldFieldValue | null }[];
  // What realtime last said the database holds, so a failed save can show it.
  server: IWorldEntryFieldValue | undefined;
  // Whether the row exists when the next save commits: deleting a missing row
  // sends no realtime change to wait for.
  rowExists: boolean;
  timeout?: ReturnType<typeof setTimeout>;
}

export interface FieldValueWriteTarget {
  entryId: string;
  worldId: string;
  fieldDefinitionId: string;
}

export interface FieldValueWritesOptions {
  // Sends one save; `null` deletes the value.
  send: (
    target: FieldValueWriteTarget,
    value: WorldFieldValue | null,
  ) => Promise<void>;
  // Shows a value in the store (undefined: no value), whether this window's
  // own unsaved change or what the database holds.
  show: (
    entryId: string,
    fieldDefinitionId: string,
    value: IWorldEntryFieldValue | undefined,
  ) => void;
}

const keyOf = (entryId: string, fieldDefinitionId: string) =>
  `${entryId}\u0000${fieldDefinitionId}`;

export function createFieldValueWrites(options: FieldValueWritesOptions) {
  const fields = new Map<string, FieldWrites>();

  const release = (key: string, writes: FieldWrites) => {
    clearTimeout(writes.timeout);
    if (fields.get(key) === writes) fields.delete(key);
  };

  const settleIfIdle = (
    key: string,
    writes: FieldWrites,
    target: FieldValueWriteTarget,
  ) => {
    if (writes.inFlight || writes.queued || fields.get(key) !== writes) return;
    if (writes.owed.length === 0) {
      release(key, writes);
      // Its change arrived before the response: show the stored row, which
      // carries what the database set (gm_only). Otherwise the field already
      // shows the saved value.
      if (deepEqual(writes.server?.value ?? null, writes.latest)) {
        options.show(target.entryId, target.fieldDefinitionId, writes.server);
      }
      return;
    }
    clearTimeout(writes.timeout);
    writes.timeout = setTimeout(
      () => release(key, writes),
      FIELD_WRITE_ECHO_TIMEOUT_MS,
    );
  };

  const sendNext = (
    key: string,
    writes: FieldWrites,
    target: FieldValueWriteTarget,
    value: WorldFieldValue | null,
    waiters: Waiter[],
  ) => {
    writes.inFlight = true;
    clearTimeout(writes.timeout);
    // Owed before sending: the realtime change can beat the response.
    const owed = { value };
    const owesChange = value !== null || writes.rowExists;
    if (owesChange) writes.owed.push(owed);
    options.send(target, value).then(
      () => {
        writes.rowExists = value !== null;
        writes.inFlight = false;
        waiters.forEach((waiter) => waiter.resolve());
        next();
      },
      (cause) => {
        writes.inFlight = false;
        writes.owed = writes.owed.filter((entry) => entry !== owed);
        waiters.forEach((waiter) => waiter.reject(cause));
        if (!writes.queued) {
          // Nothing newer to send: show what the database holds and let
          // realtime drive the field again.
          writes.owed = [];
          if (fields.get(key) !== writes) return;
          release(key, writes);
          options.show(target.entryId, target.fieldDefinitionId, writes.server);
          return;
        }
        next();
      },
    );

    function next() {
      const queued = writes.queued;
      if (queued) {
        writes.queued = undefined;
        sendNext(key, writes, target, queued.value, queued.waiters);
      } else {
        settleIfIdle(key, writes, target);
      }
    }
  };

  return {
    // Shows the change at once and saves it after any save already in flight.
    write(
      target: FieldValueWriteTarget,
      value: WorldFieldValue | null,
      current: IWorldEntryFieldValue | undefined,
    ): Promise<void> {
      const key = keyOf(target.entryId, target.fieldDefinitionId);
      let writes = fields.get(key);
      if (!writes) {
        writes = {
          latest: value,
          inFlight: false,
          owed: [],
          server: current,
          rowExists: !!current,
        };
        fields.set(key, writes);
      }
      writes.latest = value;

      options.show(
        target.entryId,
        target.fieldDefinitionId,
        value === null
          ? undefined
          : {
              entryId: target.entryId,
              fieldDefinitionId: target.fieldDefinitionId,
              worldId: target.worldId,
              gmOnly: current?.gmOnly ?? false,
              value,
            },
      );

      return new Promise<void>((resolve, reject) => {
        const waiter = { resolve, reject };
        if (writes.inFlight) {
          writes.queued = {
            value,
            waiters: [...(writes.queued?.waiters ?? []), waiter],
          };
        } else {
          sendNext(key, writes, target, value, [waiter]);
        }
      });
    },

    // Takes a realtime change. Returns whether it should be shown: false while
    // this window's own saves are still catching up on the field.
    receive(
      entryId: string,
      fieldDefinitionId: string,
      value: IWorldEntryFieldValue | undefined,
    ): boolean {
      const key = keyOf(entryId, fieldDefinitionId);
      const writes = fields.get(key);
      if (!writes) return true;
      writes.server = value;
      const head = writes.owed[0];
      if (head && deepEqual(head.value, value?.value ?? null)) {
        writes.owed.shift();
      }
      if (!writes.inFlight && !writes.queued && writes.owed.length === 0) {
        release(key, writes);
        return true;
      }
      return false;
    },

    // A snapshot replaced every value. It is newer than any save already
    // settled, so only fields with a save still to settle keep their change.
    // Returns the fields to keep.
    receiveSnapshot(
      values: Record<string, Record<string, IWorldEntryFieldValue>>,
    ): { entryId: string; fieldDefinitionId: string }[] {
      const kept: { entryId: string; fieldDefinitionId: string }[] = [];
      fields.forEach((writes, key) => {
        const [entryId, fieldDefinitionId] = key.split("\u0000");
        writes.server = values[entryId]?.[fieldDefinitionId];
        writes.owed = [];
        if (writes.inFlight || writes.queued) {
          kept.push({ entryId, fieldDefinitionId });
        } else {
          release(key, writes);
        }
      });
      return kept;
    },

    // Stops holding an entry's fields, as when it can no longer be read.
    forgetEntry(entryId: string) {
      fields.forEach((writes, key) => {
        if (key.startsWith(`${entryId}\u0000`)) release(key, writes);
      });
    },

    // Stops holding every field; saves in flight still finish.
    clear() {
      fields.forEach((writes, key) => release(key, writes));
    },
  };
}
