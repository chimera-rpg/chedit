import type { Coordinate, CoordinateArch } from "src/interfaces/editor"
import { writable } from "svelte/store"
import type { Writable } from 'svelte/store'


export interface BlueprintsStore {
  shapes: (Coordinate|CoordinateArch)[][]
  shape: (Coordinate|CoordinateArch)[]
}

export const blueprints: Writable<BlueprintsStore> = writable({
  shapes: [],
  shape: [],
})