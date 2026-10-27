import * as Y from "yjs";

export type UndoOwner = "shared" | "secrets";

interface StackEvent {
  type: "undo" | "redo";
}

// A surface with secrets edits two documents, so it has two undo stacks: the
// shared note's and the companion's. This routes Mod+Z and Shift+Mod+Z to
// whichever took the last change, keeping the order the person made them in.
export class UndoCoordinator {
  private managers = new Map<UndoOwner, Y.UndoManager>();
  private undoOrder: UndoOwner[] = [];
  private redoOrder: UndoOwner[] = [];
  private detachers = new Map<UndoOwner, () => void>();

  // Starts following a stack, replacing the one this owner had (the shared
  // editor makes a new one when it is recreated).
  public track(owner: UndoOwner, manager: Y.UndoManager) {
    if (this.managers.get(owner) === manager) return;
    this.untrack(owner);
    this.managers.set(owner, manager);

    const onAdded = (event: StackEvent) => {
      if (event.type === "undo") {
        this.undoOrder.push(owner);
        // A new change, not one put back by redo, ends what can be redone.
        if (!manager.undoing && !manager.redoing) this.redoOrder = [];
      } else {
        this.redoOrder.push(owner);
      }
    };
    const onPopped = (event: StackEvent) => {
      const order = event.type === "undo" ? this.undoOrder : this.redoOrder;
      const at = order.lastIndexOf(owner);
      if (at >= 0) order.splice(at, 1);
    };
    const onCleared = () => {
      this.undoOrder = this.undoOrder.filter((o) => o !== owner);
      this.redoOrder = this.redoOrder.filter((o) => o !== owner);
    };
    manager.on("stack-item-added", onAdded);
    manager.on("stack-item-popped", onPopped);
    manager.on("stack-cleared", onCleared);
    this.detachers.set(owner, () => {
      manager.off("stack-item-added", onAdded);
      manager.off("stack-item-popped", onPopped);
      manager.off("stack-cleared", onCleared);
    });
  }

  public untrack(owner: UndoOwner) {
    this.detachers.get(owner)?.();
    this.detachers.delete(owner);
    this.managers.delete(owner);
    this.undoOrder = this.undoOrder.filter((o) => o !== owner);
    this.redoOrder = this.redoOrder.filter((o) => o !== owner);
  }

  public undo() {
    return this.run(
      this.undoOrder,
      (m) => m.undoStack.length,
      (m) => m.undo(),
    );
  }

  public redo() {
    return this.run(
      this.redoOrder,
      (m) => m.redoStack.length,
      (m) => m.redo(),
    );
  }

  private run(
    order: UndoOwner[],
    size: (manager: Y.UndoManager) => number,
    apply: (manager: Y.UndoManager) => unknown,
  ) {
    // Skip owners whose stack has emptied without telling us.
    while (order.length > 0) {
      const manager = this.managers.get(order[order.length - 1]);
      if (manager && size(manager) > 0) {
        apply(manager);
        return true;
      }
      order.pop();
    }
    return false;
  }

  public destroy() {
    [...this.detachers.keys()].forEach((owner) => this.untrack(owner));
  }
}
