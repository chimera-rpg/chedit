export type Coordinate = {
  x: number
  y: number
  z: number
}

export type Cursor = {
  start: Coordinate
  end: Coordinate
  hover: Coordinate
  selected: Coordinate[]
  selecting: Coordinate[]
  placing: Coordinate[]
}

