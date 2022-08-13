/**
 * Undoable represents a generic interface for making an object able to have atomic changes applied and unapplied from it.
 */
export interface Undoable {
  stack: UndoStep[]
  stackPos: number
  apply(u: UndoStep): void
  undo(): UndoStep
  undoable: boolean
  redo(): UndoStep
  redoable: boolean
  queue(): boolean
  unqueue(): boolean
  queued: boolean
  queueStack: QueueStep
}

/**
 * UndoStep is simply a step that modifies an Undoable in an atomic and reversible manner.
 */
export interface UndoStep {
  apply(c: Undoable): Undoable
  unapply(c: Undoable): Undoable
}


export class QueueStep implements UndoStep {
  steps: UndoStep[] = []

  push(u: UndoStep) {
    this.steps.push(u)
  }
  apply(c: Undoable): Undoable {
    for (let a of this.steps) {
      c = a.apply(c)
    }
    return c
  }
  unapply(c: Undoable): Undoable {
    for (let a of this.steps.reverse()) {
      c = a.unapply(c)
    }
    return c
  }
}