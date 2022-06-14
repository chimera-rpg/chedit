import type { Coordinate } from "src/interfaces/editor"
import { writable, Writable } from "svelte/store"


export interface BlueprintsStore {
  shapes: Coordinate[][]
  shape: Coordinate[]
}

export const blueprints: Writable<BlueprintsStore> = writable({
  shapes: [],
  shape: [],
})