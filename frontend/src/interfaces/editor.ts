import type { Archetype } from "./Archetype"

export type Coordinate = {
  x: number
  y: number
  z: number
  i: number
  arch?: Archetype
}

export type CoordinateMatch = Coordinate & {
  matched: boolean
}

export type Cursor = {
  start: Coordinate
  end: Coordinate
  hover: Coordinate
  selected: Coordinate[]
  selecting: Coordinate[]
  placing: Coordinate[]
}

export type ArchMatcher = {
  archs?: string[]
  name?: string
  type?: string
}

export type CursorRules = {
  height: number
  width: number
  depth: number
}

export type WandRules = {
  shouldMatchArchetypes: boolean
  shouldMatchName: boolean
  shouldMatchType: boolean
  matchArchetypes: string
  matchName: string
  matchType: string
  matchY?: boolean
  matchX?: boolean
  matchZ?: boolean
  diagonal?: boolean
}

// Note: We don't use matchY,X,Z,diagonal
export type ReplaceRules = WandRules & {
  matchMode: 'entire' | 'top' | 'range'
  range: [number, number]
  replaceMode: 'replace' | 'merge'
}

export type InsertRules = WandRules & {
  checkForReplace: boolean
  insertOnNoMatch: boolean
  replaceMode: 'replace' | 'merge'
}

export type PlacingRules = {
  deduplicate: boolean
  clear: boolean
}

export type ToolType = 'insert'|'erase'|'fill'|'placing'|'wand'

export let ArchetypeTypes = {
  "Building": [
    "Tile",
    "Block",
    "Flora",
    "Exit",
    "Audio",
  ],
  "Items": [
    "Item",
    "Armor",
    "Shield",
    "Weapon",
    "Food",
  ],
  "Characters": [
    "PC",
    "NPC",
  ],
  "System": [
    "Special",
    "Skill",
    "Bullet",
    "Genus",
    "Species",
    "Faction",
  ],
  "Other": [
    "Generic",
  ],
}

export let MatterTypes = [
  "None",
  "Solid",
  "Liquid",
  "Gas",
  "Plasma",
  "Physical",
  "Spirit",
  "Arcane",
  "Opaque",
]