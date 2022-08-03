import { parse } from 'yaml'
import type { BaseMaps, Maps, ContainerMaps, Map, ContainerMap } from '../interfaces/Map'
import type { Archetype, ArchetypeContainer } from '../interfaces/Archetype'
import { cloneObject, compileInJS } from './archs'
import { QueueStep } from './undo'
import type { Undoable, UndoStep } from './undo'

export function loadMapsFromYAML(source: string): ContainerMaps {
  let maps: ContainerMaps = {}
  let baseMaps: Maps = parse(source)

  for (let [k, m] of Object.entries(baseMaps)) {
    let m2: ContainerMap = makeMap()
    for (let [fieldKey, fieldValue] of Object.entries(m)) {
      if (fieldKey !== 'Tiles') {
        m2[fieldKey] = fieldValue
      }
    }
    if (m.Tiles) {
      m2.Tiles = []
      for (let y = 0; y < m.Tiles.length; y++) {
        m2.Tiles[y] = []
        for (let x = 0; x < m.Tiles[y].length; x++) {
          m2.Tiles[y][x] = []
          for (let z = 0; z < m.Tiles[y][x].length; z++) {
            m2.Tiles[y][x][z] = []
            for (let i = 0; i < m.Tiles[y][x][z].length; i++) {
              let compiled: Archetype
              let error: any
              try {
                compiled = compileInJS(cloneObject(m.Tiles[y][x][z][i]), true)
              } catch(err) {
                compiled = cloneObject(m.Tiles[y][x][z][i])
                error = err
              }
              m2.Tiles[y][x][z][i] = {
                Compiled: compiled,
                Error: error,
                Original: m.Tiles[y][x][z][i],
              }
            }
          }
        }
      }
    }
    maps[k] = m2
  }
  
  return maps
}

export function createMap(): ContainerMap {
  let m = makeMap()
  m.Name = 'new map'
  m.Description = ''
  m.Lore = ''
  m.ResetTime = 0
  m.Darkness = 0
  m.Width = 20
  m.Height = 20
  m.Depth = 20
  m.Y = 0
  m.X = 0
  m.Z = 0
  m.Script = ''
  m.Tiles = []
  for (let y = 0; y < m.Height; y++) {
    m.Tiles[y] = []
    for (let x = 0; x < m.Width; x++) {
      m.Tiles[y][x] = []
      for (let z = 0; z < m.Depth; z++) {
        m.Tiles[y][x][z] = []
      }
    }
  }
  return m
}

export function makeMap(): ContainerMap {
  let m: ContainerMap = {
    stack: [],
    stackPos: 0,
    undoable: false,
    redoable: false,
    queued: false,
    queueStack: undefined,
    apply: (u: UndoStep) => {
      u.apply(m)
      if (m.queueStack) {
        m.queueStack.push(u)
      } else {
        m.stack = [...m.stack.slice(0, m.stackPos), u]
        m.stackPos++
        m.undoable = m.stackPos >= 1 && m.stack.length > 0
        m.redoable = m.stackPos < m.stack.length
      }
    },
    undo: () => {
      if (!m.undoable) return false
      m.stack[--m.stackPos].unapply(m)
      m.undoable = m.stackPos >= 1 && m.stack.length > 0
      m.redoable = m.stackPos < m.stack.length
      return true
    },
    redo: () => {
      if (!m.redoable) return false
      m.stack[m.stackPos++].apply(m)
      m.undoable = m.stackPos >= 1 && m.stack.length > 0
      m.redoable = m.stackPos < m.stack.length
      return true
    },
    queue: () => {
      if (m.queued) {
        console.error(new Error('queue request when already queued -- closing previous'))
        m.unqueue()
      }
      m.queueStack = new QueueStep()
      return m.queued = true
    },
    unqueue: () => {
      if (!m.queued) {
        throw 'not queued!'
      }
      if (m.queueStack.steps.length === 0) {
        m.queueStack = null
        return m.queued = false
      }
      m.stack = [...m.stack.slice(0, m.stackPos), m.queueStack]
      m.stackPos++
      m.undoable = m.stackPos >= 1 && m.stack.length > 0
      m.redoable = m.stackPos < m.stack.length

      m.queueStack = null
      return m.queued = false
    },
    export: (): Map => {
      let m2: Map = {}

      for (let [key, value] of Object.entries(m)) {
        if (MapFields.includes(key)) {
          m2[key] = value
        }
      }
      m2.Tiles = []
      for (let y = 0; y < m.Tiles.length; y++) {
        m2.Tiles[y] = []
        for (let x = 0; x < m.Tiles[y].length; x++) {
          m2.Tiles[y][x] = []
          for (let z = 0; z < m.Tiles[y][x].length; z++) {
            m2.Tiles[y][x][z] = []
            for (let i = 0; i < m.Tiles[y][x][z].length; i++) {
              m2.Tiles[y][x][z][i] = m.Tiles[y][x][z][i].Original
            }
          }
        }
      }

      return m2
    }
  }
  return m
}

export const MapFields = ['DataName', 'Name', 'Description', 'Lore', 'Depth', 'Width', 'Height', 'Darkness', 'Haven', 'ResetTime', 'Y', 'X', 'Z', 'Script']

type MapActionPosition = {
  y: number;
  x: number;
  z: number;
  i: number;
}

type MapActionArchetype = {
  arch?: ArchetypeContainer
}

type MapActionArchetypeReplace = {
  archName: string
  replace: boolean
}

export class MapInsertAction implements UndoStep {
  y = 0
  x = 0
  z = 0
  i = 0
  arch: ArchetypeContainer

  constructor({ y = 0, x = 0, z = 0, i = 0, arch }: MapActionPosition & MapActionArchetype) {
    this.arch = arch
    this.y = y
    this.x = x
    this.z = z
    this.i = i
  }

  apply(c: ContainerMap): ContainerMap {
    if (this.y < 0 || this.x < 0 || this.z < 0) return c
    if (this.y >= c.Height || this.x >= c.Width || this.z >= c.Depth) return c
    if (!this.arch) return c

    let p = this.i
    if (p === -1) {
      p = c.Tiles[this.y][this.x][this.z].length
    }
    this.i = p
    c.Tiles[this.y][this.x][this.z].splice(p, 0, this.arch)

    return c
  }
  unapply(c: ContainerMap): ContainerMap {
    if (this.y < 0 || this.x < 0 || this.z < 0) return c
    if (this.y >= c.Height || this.x >= c.Width || this.z >= c.Depth) return c

    let p = this.i
    if (p === -1) {
      p = c.Tiles[this.y][this.x][this.z].length-1
    }
    this.i = p
    c.Tiles[this.y][this.x][this.z].splice(p, 1)
    return c
  }
}

export class MapReplaceAction implements UndoStep {
  y = 0
  x = 0
  z = 0
  i = 0
  replace = false
  arch: ArchetypeContainer
  archName = ''

  constructor({ y = 0, x = 0, z = 0, i = 0, replace = true, archName }: MapActionPosition & MapActionArchetypeReplace) {
    this.archName = archName
    this.replace = replace
    this.y = y
    this.x = x
    this.z = z
    this.i = i
  }

  apply(c: ContainerMap): ContainerMap {
    if (this.y < 0 || this.x < 0 || this.z < 0) return c
    if (this.y >= c.Height || this.x >= c.Width || this.z >= c.Depth) return c
    if (this.i < 0 || this.i >= c.Tiles[this.y][this.x][this.z].length) return c

    this.arch = cloneObject(c.Tiles[this.y][this.x][this.z][this.i])
    if (this.replace) {
      c.Tiles[this.y][this.x][this.z][this.i].Original = {
        Archs: [this.archName]
      }
    } else {
      c.Tiles[this.y][this.x][this.z][this.i].Original.Archs = [this.archName]
    }

    let compiled: Archetype
    let error: any
    try {
      compiled = compileInJS(cloneObject(c.Tiles[this.y][this.x][this.z][this.i].Original), true)
    } catch(err) {
      compiled = cloneObject(c.Tiles[this.y][this.x][this.z][this.i].Original)
      c.Tiles[this.y][this.x][this.z][this.i].Error = err
    }
    c.Tiles[this.y][this.x][this.z][this.i].Compiled = compiled

    return c
  }
  unapply(c: ContainerMap): ContainerMap {
    if (this.y < 0 || this.x < 0 || this.z < 0) return c
    if (this.y >= c.Height || this.x >= c.Width || this.z >= c.Depth) return c
    if (this.i < 0 || this.i >= c.Tiles[this.y][this.x][this.z].length) return c

    let arch = c.Tiles[this.y][this.x][this.z][this.i]
    c.Tiles[this.y][this.x][this.z][this.i] = this.arch
    this.arch = arch

    return c
  }
}

export class MapRemoveAction extends MapInsertAction {
  apply(c: ContainerMap): ContainerMap {
    if (this.y < 0 || this.x < 0 || this.z < 0) return c
    if (this.y >= c.Height || this.x >= c.Width || this.z >= c.Depth) return c

    if (!c.Tiles[this.y][this.x][this.z][this.i]) return c

    this.arch = c.Tiles[this.y][this.x][this.z].splice(this.i, 1)[0]

    return super.unapply(c)
  }
  unapply(c: ContainerMap): ContainerMap {
    return super.apply(c)
  }
}

export class MapClearAction {
  y = 0
  x = 0
  z = 0

  tiles: ArchetypeContainer[]

  constructor({ y = 0, x = 0, z = 0 }) {
    this.y = y
    this.x = x
    this.z = z
  }

  apply(c: ContainerMap): ContainerMap {
    if (this.y < 0 || this.x < 0 || this.z < 0) return c
    if (this.y >= c.Height || this.x >= c.Width || this.z >= c.Depth) return c

    this.tiles = c.Tiles[this.y][this.x][this.z]
    c.Tiles[this.y][this.x][this.z] = []

    return c
  }
  unapply(c: ContainerMap): ContainerMap {
    c.Tiles[this.y][this.x][this.z] = this.tiles
    this.tiles = []

    return c
  }
}

export class MapChangeFieldAction implements UndoStep {
  key = ""
  value: any = ""

  constructor({ key = "", value = ""}: {key: string, value: any}) {
    this.key = key
    this.value = value
  }

  apply(c: ContainerMap): ContainerMap {
    /*if (c[this.key] === undefined) {
      return c
    }*/

    let oldValue = c[this.key]
    c[this.key] = this.value
    this.value = oldValue

    return c
  }
  unapply(c: ContainerMap): ContainerMap {
    /*if (c[this.key] === undefined) {
      return c
    }*/

    let oldValue = c[this.key]
    c[this.key] = this.value
    this.value = oldValue

    return c
  }
}

export class MapResizeAction implements UndoStep {
  height = 0
  width = 0
  depth = 0
  left = 0
  right = 0
  top = 0
  bottom = 0
  up = 0
  down = 0
  acquired = false
  tiles: ArchetypeContainer[][][][]

  constructor({left = 0, right = 0, top = 0, bottom = 0, up = 0, down = 0}) {
    this.left = left
    this.right = right
    this.top = top
    this.bottom = bottom
    this.up = up
    this.down = down
  }

  apply(c: ContainerMap): ContainerMap {
    if (this.acquired) {
      // We're calling unapply since all it does is restore tiles and dimensions, then stores whatever the overriding value is.
      return this.unapply(c)
    }

    let newHeight = c.Height + this.up + this.down
    let newWidth = c.Width + this.left + this.right
    let newDepth = c.Depth + this.top + this.bottom

    let offsetY = this.down
    let offsetX = this.left
    let offsetZ = this.top

    // FIXME: This is unhealthily lazy to just clone the tiles.
    let newTiles: ArchetypeContainer[][][][] = []
    for (let y = 0; y < newHeight; y++) {
      newTiles.push([])
      for (let x = 0; x < newWidth; x++) {
        newTiles[y].push([])
        for (let z = 0; z < newDepth; z++) {
          newTiles[y][x].push([])
        }
      }
    }
    // Copy 'em.
    for (let y = 0; y < c.Height; y++) {
      if (y+offsetY < 0 || y+offsetY >= newHeight) continue
      for (let x = 0; x < c.Width; x++) {
        if (x+offsetX < 0 || x+offsetX >= newWidth) continue
        for (let z = 0; z < c.Depth; z++) {
          if (z+offsetZ < 0 || z+offsetZ >= newDepth) continue
          for (let o of c.Tiles[y][x][z]) {
            newTiles[y+offsetY][x+offsetX][z+offsetZ].push(cloneObject(o))
          }
        }
      }
    }

    // Store values for undoing.
    this.tiles = c.Tiles
    this.width = c.Width
    this.height = c.Height
    this.depth = c.Depth

    // Replace map's properties with our new ones.
    c.Tiles = newTiles
    c.Height = newHeight
    c.Width = newWidth
    c.Depth = newDepth

    this.acquired = true

    return c
  }
  unapply(c: ContainerMap): ContainerMap {
    let newTiles = c.Tiles
    let newHeight = c.Height
    let newWidth = c.Width
    let newDepth = c.Depth

    c.Tiles = this.tiles
    c.Height = this.height
    c.Width = this.width
    c.Depth = this.depth

    this.tiles = newTiles
    this.height = newHeight
    this.width = newWidth
    this.depth = newDepth

    return c
  }
}