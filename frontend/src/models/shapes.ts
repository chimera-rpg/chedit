import type { ContainerMap } from "../interfaces/Map"
import type { Coordinate, CoordinateMatch, ArchMatcher, WandRules } from "../interfaces/editor"
import type { ReplaceRules } from "../interfaces/editor"
import type { ArchetypeContainer } from "../interfaces/Archetype"

export interface TraversedTile {
  y: number
  x: number
  z: number
  i: number
  initial: boolean
}

export type KeysState = {[key: string]: boolean}

export function adjustShape(map: ContainerMap, base: Coordinate[], coords: Coordinate[], keys: KeysState) {
  if (keys.shift) {
    // add
    for (let v of coords) {
      if (!base.find(v2=>v.y===v2.y&&v.x===v2.x&&v.z===v2.z)) {
        if (v.y < 0 || v.y >= map.Height || v.x < 0 || v.x >= map.Width || v.z < 0 || v.z >= map.Depth) return
        base.push(v)
      }
    }
  } else if (keys.ctrl) {
    // remove
    base = base.filter(v=>!coords.find(v2=>v.y===v2.y&&v.x===v2.x&&v.z===v2.z))
  } else {
    // replace
    base = coords
  }
  return base
}

export function getMatchingCoordsForTile(map: ContainerMap, t: TraversedTile, wandRules: WandRules, matchers: ArchMatcher[]): CoordinateMatch[] {
  let coords: CoordinateMatch[] = []

  let getCoord = (y: number, x: number, z: number) => {
    if (y < 0 || y >= map.Height) return
    if (x < 0 || x >= map.Width) return
    if (z < 0 || z >= map.Depth) return
    if (coords.find(v=>v.y===y&&v.x===x&&v.z===z)) return

    let open = true
    let tiles = map.Tiles[y][x][z]
    if (tiles.length > 0 && matchers.length===0) open = false
    else {
      if (matchers.length !== 0 && tiles.length === 0) {
        open = false
      } else {
        for (let m of matchers) {
          let okay = true
          for (let a of tiles) {
            if (m.archs) {
              for (let mArch of m.archs) {
                let has = false
                for (let arch of a.Original.Archs) {
                  if (mArch === arch) {
                    has = true
                    break
                  }
                }
                if (!has) {
                  okay = false
                  break
                }
              }
            }
            if (okay && m.name !== undefined) {
              let r = new RegExp(m.name)
              if (!r.test(a.Compiled.Name)) {
                okay = false
                break
              }
            }
            if (okay && m.type !== undefined) {
              let r = new RegExp(m.type)
              if (!r.test(a.Compiled.Type)) {
                okay = false
                break
              }
            }
          }
          if (!okay) {
            open = false
            break
          }
        }
      }
    }

    if (!open) {
      coords.push({
        y, x, z,
        i: 0,
        matched: false,
      })
      return
    }

    coords.push({
      y, x, z,
      i: 0,
      matched: true,
    })

    // Get neighbors.
    // Up, Down
    if (wandRules.matchY) {
      getCoord(y-1, x, z)
      getCoord(y+1, x, z)
    }
    // Left, right
    if (wandRules.matchX) {
      getCoord(y, x-1, z)
      getCoord(y, x+1, z)
    }
    // Top, bottom
    if (wandRules.matchZ) {
      getCoord(y, x, z-1)
      getCoord(y, x, z+1)
    }

    if (wandRules.diagonal) {
      if (wandRules.matchX && wandRules.matchY) {
        getCoord(y-1, x-1, z)
        getCoord(y+1, x-1, z)
        getCoord(y+1, x+1, z)
        getCoord(y-1, x+1, z)
      }
      if (wandRules.matchX && wandRules.matchZ) {
        getCoord(y, x-1, z-1)
        getCoord(y, x-1, z+1)
        getCoord(y, x+1, z+1)
        getCoord(y, x+1, z-1)
      }
      if (wandRules.matchY && wandRules.matchZ) {
        getCoord(y-1, x, z-1)
        getCoord(y-1, x, z+1)
        getCoord(y+1, x, z+1)
        getCoord(y+1, x, z-1)
      }
    }
  }

  getCoord(t.y, t.x, t.z)

  return coords
}

export function replaceShape(coords: Coordinate[], map: ContainerMap, rules: ReplaceRules): Coordinate[] {
  function getTile(y: number, x: number, z: number): ArchetypeContainer[]|null {
    if (y < 0 || x < 0 || z < 0) return null
    if (y >= map.Height || x >= map.Width || z >= map.Depth) return null
    return map.Tiles[y][x][z]
  }

  // First collect all our coordinates.
  if (rules.matchMode === 'entire') {
    let coords2: Coordinate[] = []
    for (let c of coords) {
      let tile = getTile(c.y, c.x, c.z)
      if (tile !== null) {
        for (let i = 0; i < tile.length; i++) {
          coords2.push({y: c.y, x: c.x, z: c.z, i})
        }
      }
    }
    coords = coords2
  } else if (rules.matchMode === 'top') {
    let coords2: Coordinate[] = []
    for (let c of coords) {
      let tile = getTile(c.y, c.x, c.z)
      if (tile !== null || tile.length !== 0) {
        coords2.push({y: c.y, x: c.x, z: c.z, i: tile.length-1})
      }
    }
    coords = coords2
  } else if (rules.matchMode === 'range') {
    let coords2: Coordinate[] = []
    for (let c of coords) {
      let tile = getTile(c.y, c.x, c.z)
      if (tile !== null || tile.length !== 0) {
        for (let i = rules.range[0]; i < rules.range[1]; i++) {
          if (i < 0 || i >= tile.length) continue
          coords2.push({y: c.y, x: c.x, z: c.z, i})
        }
      }
    }
    coords = coords2
  }

  // Now apply our filters.
  coords = coords.filter(c => {
    let tile = getTile(c.y, c.x, c.z)
    if (rules.shouldMatchArchetypes) {
      if (!tile[c.i].Compiled.Archs?.find(v=>rules.matchArchetypes.split(',').includes(v))) {
        return false
      }
    }
    if (rules.shouldMatchName) {
      let r = new RegExp(rules.matchName)
      if (!r.test(tile[c.i].Compiled.Name)) {
        return false
      }
    }
    if (rules.shouldMatchType) {
      let r = new RegExp(rules.matchType)
      if (!r.test(tile[c.i].Compiled.Type)) {
        return false
      }
    }
    return true
  })

  return coords
}

export function trimShape(c: Coordinate[]): Coordinate[] {
  let sortX = c.sort((a, b) => {
    if (a.x < b.x) return -1
    if (a.x > b.x) return 1
    return 0
  })
  let sortY = c.sort((a, b) => {
    if (a.y < b.y) return -1
    if (a.y > b.y) return 1
    return 0
  })
  let sortZ = c.sort((a, b) => {
    if (a.z < b.z) return -1
    if (a.z > b.z) return 1
    return 0
  })

  let minX = sortX[0]?.x || 0
  let minY = sortY[0]?.y || 0
  let minZ = sortZ[0]?.z || 0

  return c.map(v=>({
    ...v,
    y: v.y - minY,
    x: v.x - minX,
    z: v.z - minZ,
  }))
}