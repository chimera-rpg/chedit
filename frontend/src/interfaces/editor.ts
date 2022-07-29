export type Coordinate = {
  x: number
  y: number
  z: number
  i: number
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

export type ToolType = 'insert'|'erase'|'fill'|'placing'|'wand'