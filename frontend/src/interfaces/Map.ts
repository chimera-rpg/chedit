import type { Archetype } from "./Archetype"

export interface Map {
  DataName?: string
  Name?: string
  Description?: string
  Lore?: string
  Depth?: number
  Width?: number
  Height?: number
  Darkness?: number
  ResetTime?: number
  Y?: number
  X?: number
  Z?: number
  Tiles?: Archetype[][][][]
  Script?: string
}

export type Maps = {[key: string]: Map}