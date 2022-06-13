/**
 * Undoable represents a generic interface for making an object able to have atomic changes applied and unapplied from it.
 */
export interface Undoable {
  stack: UndoStep[]
  stackPos: number
  apply(u: UndoStep): void
  undo(): boolean
  undoable: boolean
  redo(): boolean
  redoable: boolean
}

/**
 * UndoStep is simply a step that modifies an Undoable in an atomic and reversible manner.
 */
export interface UndoStep {
  apply(c: Undoable): Undoable
  unapply(c: Undoable): Undoable
}