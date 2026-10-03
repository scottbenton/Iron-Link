interface OrderedRecord {
  worldId: string;
  sortOrder: number;
}

type Orders = Record<string, number>;
interface OrderScope {
  desired: Orders;
  observed: Orders;
  rollback: Orders;
  pending: number;
  saved: boolean;
  tail: Promise<void>;
  timer?: ReturnType<typeof setTimeout>;
}

const CONFIRMATION_TIMEOUT = 10_000;
const ordersOf = (records: Record<string, OrderedRecord>): Orders =>
  Object.fromEntries(
    Object.entries(records).map(([id, record]) => [id, record.sortOrder]),
  );

// Only sortOrder is overlaid: realtime edits and removals retain their identity
// and all other properties. RPCs in one scope are serialized, so overlapping
// gestures cannot commit in the opposite order to the user's gestures.
export function createWorldConfigurationOrder() {
  let worldId = "";
  const scopes = new Map<string, OrderScope>();
  const clear = (key: string, scope: OrderScope) => {
    clearTimeout(scope.timer);
    if (scopes.get(key) === scope) scopes.delete(key);
  };
  return {
    reset(nextWorldId = "") {
      if (nextWorldId === worldId) return;
      for (const [key, scope] of scopes) clear(key, scope);
      worldId = nextWorldId;
    },
    overlay<T extends OrderedRecord>(
      key: string,
      records: Record<string, T>,
    ): Record<string, T> {
      const desired = scopes.get(key)?.desired;
      if (!desired) return records;
      return Object.fromEntries(
        Object.entries(records).map(([id, record]) => [
          id,
          record.worldId === worldId && desired[id] !== undefined
            ? { ...record, sortOrder: desired[id] }
            : record,
        ]),
      );
    },
    observe(
      key: string,
      records: Record<string, OrderedRecord>,
      removed: string[],
      replace: boolean,
    ) {
      const scope = scopes.get(key);
      if (!scope) return;
      scope.observed = replace
        ? ordersOf(records)
        : { ...scope.observed, ...ordersOf(records) };
      removed.forEach((id) => delete scope.observed[id]);
      if (!scope.saved) scope.rollback = { ...scope.observed };
      if (
        scope.pending === 0 &&
        Object.entries(scope.desired).every(
          ([id, order]) => scope.observed[id] === order,
        )
      )
        clear(key, scope);
    },
    reorder(
      key: string,
      records: Record<string, OrderedRecord>,
      ids: string[],
      save: () => Promise<void>,
      apply: (orders: Orders) => void,
      onUnconfirmed: () => void,
    ) {
      if (
        ids.length !== Object.keys(records).length ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => !records[id] || records[id].worldId !== worldId)
      ) {
        return Promise.reject(
          new Error("The configuration changed. Please try reordering again."),
        );
      }
      const orders = Object.fromEntries(ids.map((id, index) => [id, index]));
      const scope = scopes.get(key) ?? {
        desired: orders,
        observed: ordersOf(records),
        rollback: ordersOf(records),
        pending: 0,
        saved: false,
        tail: Promise.resolve(),
      };
      scopes.set(key, scope);
      clearTimeout(scope.timer);
      scope.pending++;
      scope.desired = orders;
      const operation = scope.tail.then(async () => {
        if (scopes.get(key) !== scope) return;
        let failed = false;
        try {
          await save();
          scope.rollback = orders;
          scope.saved = true;
        } catch (cause) {
          failed = true;
          throw cause;
        } finally {
          if (scopes.get(key) === scope) {
            scope.pending--;
            if (scope.pending === 0) {
              if (failed) scope.desired = scope.rollback;
              if (
                (failed && !scope.saved) ||
                Object.entries(scope.desired).every(
                  ([id, order]) => scope.observed[id] === order,
                )
              ) {
                clear(key, scope);
              } else {
                // Settle all bookkeeping before notifying store subscribers:
                // an apply callback may synchronously enqueue the next drag.
                scope.timer = setTimeout(() => {
                  if (scopes.get(key) !== scope) return;
                  clear(key, scope);
                  apply(scope.observed);
                  onUnconfirmed();
                }, CONFIRMATION_TIMEOUT);
              }
              if (failed) apply(scope.rollback);
            }
          }
        }
      });
      scope.tail = operation.catch(() => {});
      apply(orders);
      return operation;
    },
  };
}
