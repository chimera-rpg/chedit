<script lang='ts'>
  import { animationsConfig } from '../../models/config'
  import { styles } from '../../stores/styles'
  import { fly, slide, scale, blur, fade } from 'svelte/transition'

  import type { main, data } from '../../../wailsjs/go/models'
  import Canvas from './Canvas.svelte'
  import SplitPane from '../../components/SplitPane.svelte'
  import TilesList from './TilesList.svelte'
  import type { MapsContainer, ContainerMap, ContainerMaps } from '../../interfaces/Map'
  import { palette } from '../../stores/palette'
  import type { Archetype, ArchetypeContainer } from '../../interfaces/Archetype'
  import { cloneObject, compileInJS } from '../../models/archs'
  import { maps as mapsStore } from '../../stores/maps'
  import type { MapsStoreData } from '../../stores/maps'
  import { MapClearAction, MapInsertAction, MapRemoveAction, MapReplaceAction, MapSetArchetypeAction } from '../../models/maps'
  import type { Binds } from '../../models/binds'

  import { settingsStore } from '../../stores/settings'

  import eraserIcon from '../../assets/icons/eraser.png'
  import wandIcon from '../../assets/icons/wand.png'
  import insertIcon from '../../assets/icons/insert.png'
  import fillIcon from '../../assets/icons/fill.png'
  import saveIcon from '../../assets/icons/save.png'
  import undoIcon from '../../assets/icons/undo.png'
  import redoIcon from '../../assets/icons/redo.png'
  import mapIcon from '../../assets/icons/map.png'
  import propertiesIcon from '../../assets/icons/properties.png'
  import scriptIcon from '../../assets/icons/script.png'
  import type { Writable } from 'svelte/store'
  import { writable } from 'svelte/store'
  import type { ArchMatcher, Coordinate, CoordinateMatch, Cursor, WandRules, ToolType, ReplaceRules } from '../../interfaces/editor'
  import { blueprints } from '../../stores/blueprints'
  import Menus from '../../components/Menus/Menus.svelte'
  import MenuBar from '../../components/Menus/MenuBar.svelte'
  import MenuItem from '../../components/Menus/MenuItem.svelte'
  import MenuList from '../../components/Menus/MenuList.svelte'
  import { SaveMap } from '../../../wailsjs/go/main/Editor'
  import ScriptsEditor from './ScriptsEditor.svelte'
  import PropertiesEditor from './PropertiesEditor.svelte'
  import ArchPreEditor from './ArchPreEditor.svelte'
  import ShapesSection from './ShapesSection.svelte'
  import ToolSettingsSection from './ToolSettingsSection.svelte';
  import ReplaceSection from './ReplaceSection.svelte'

  let tool: ToolType = 'insert'
  let lastTool: ToolType = 'insert'

  type ViewMode = 'map'|'properties'|'scripts'
  let viewMode: ViewMode = 'map'

  // Binds
  export let binds: Binds
  const commands = {
    undo: binds.asCommand('Undo', ['Control', 'Z'], () => { undo() }),
    redo: binds.asCommand('Redo', ['Control', 'Shift', 'Z'], () => { redo() }),
    save: binds.asCommand('Save', ['Control', 'S'], () => { save() }),
    copy: binds.asCommand('Copy', ['Control', 'C'], () => { copySelection() }),
    paste: binds.asCommand('Paste', ['Control', 'V'], () => { pasteSelection() }),
    swapToInsert: binds.asCommand('Swap to Insert', ['1'], () => { swapTool('insert') }),
    swapToFill: binds.asCommand('Swap to Fill', ['2'], () => { swapTool('fill') }),
    swapToErase: binds.asCommand('Swap to Erase', ['3'], () => { swapTool('erase') }),
    swapToWand: binds.asCommand('Swap to Wand', ['4'], () => { swapTool('wand') }),
    focusMap: binds.asCommand('Focus Map', ['Control', '1'], () => { setViewMode('map') }),
    focusProperties: binds.asCommand('Focus Properties', ['Control', '2'], () => { setViewMode('properties') }),
    focusScripts: binds.asCommand('Focus Scripts', ['Control', '3'], () => { setViewMode('scripts') }),
    eraseSelection: binds.asCommand('Erase Selection', ['Delete'], () => { erase($cursor.selected) }),
    openGoModeY: binds.asCommand('Go Mode Y', ['y'], () => { openGoMode('Y') }),
    openGoModeX: binds.asCommand('Go Mode X', ['x'], () => { openGoMode('X') }),
    openGoModeZ: binds.asCommand('Go Mode Z', ['z'], () => { openGoMode('Z') }),
  }
  binds.addShortcut(commands.eraseSelection.cmd, ['Backspace'])

  //
  export let mapsContainer: MapsContainer
  export let map: ContainerMap
  export let mapIndex: number
  let zoom: number = 2

  let cursor: Writable<Cursor> = writable({
    start: {x: 0, y: 0, z: 0, i: 0},
    end: {x: 0, y: 0, z: 0, i: 0},
    hover: {x: 0, y: 0, z: 0, i: 0},
    selected: [],
    selecting: [],
    placing: [],
  })

  let focusedArchetypeContainer: ArchetypeContainer
  let focusedY: number
  let focusedX: number
  let focusedZ: number
  let focusedI: number
  $: if (focusedY !== $cursor.start.y || focusedX !== $cursor.start.x || focusedZ !== $cursor.start.z || focusedI !== $cursor.start.i) {
    focusedY = $cursor.start.y
    focusedX = $cursor.start.x
    focusedZ = $cursor.start.z
    focusedI = $cursor.start.i
    focusedArchetypeContainer = map.Tiles[focusedY]?.[focusedX]?.[focusedZ]?.[focusedI]
  }

  let lastWheelTimestamp = 0
  function handleMapMousewheel(e: WheelEvent) {
    // Limit the frequency of scrolling allowed to once per ms.
    if (e.altKey || e.ctrlKey) {
      e.preventDefault()
      e.stopPropagation()
      if (e.timeStamp - lastWheelTimestamp <= 1) return
      lastWheelTimestamp = e.timeStamp
    }

    if (e.altKey) {
      let deltaY = (e.shiftKey?e.deltaX:e.deltaY) > 0 ? -1 : 1
      let hoverY = $cursor.hover.y + deltaY
      if (hoverY < 0) hoverY = 0
      if (hoverY >= map.Height) hoverY = map.Height-1

      if (hoverY !== $cursor.hover.y) {
        if (e.shiftKey || e.ctrlKey) {
          $cursor.selected = adjustShape($cursor.selected, $cursor.selected.map(v=>({
            y: v.y+deltaY,
            x: v.x,
            z: v.z,
            i: v.i,
          })), { shift: e.shiftKey, ctrl: e.ctrlKey })
          $cursor.start.y = hoverY
        }
      }
      $cursor.hover.y = hoverY
      return false
    } else if (e.ctrlKey) {
      zoom += e.deltaY > 0 ? -1 : 1
      if (zoom < 1) zoom = 1
    }
  }

  let mapEl: HTMLElement = null
  function handleMapMousemove(e: MouseEvent) {
    if (scrolling) return
    //e.stopImmediatePropagation()
    //e.stopPropagation()
    //e.preventDefault()

    let r = mapEl.getBoundingClientRect()

    let hitX = (e.clientX - r.left + mapEl.scrollLeft) / zoom
    let hitY = (e.clientY - r.top + mapEl.scrollTop) / zoom

    let xOffset = $cursor.hover.y * -animationsConfig.YStep.X
    let yOffset = $cursor.hover.y * animationsConfig.YStep.Y + (map.Height * -animationsConfig.YStep.Y)

    let nearestX = Math.floor((hitX + xOffset) / animationsConfig.TileWidth)
    let nearestZ = Math.floor((hitY - yOffset) / animationsConfig.TileHeight)

    if (nearestX < 0) nearestX = 0
    if (nearestZ < 0) nearestZ = 0
    if (nearestX >= map.Width) nearestX = map.Width-1
    if (nearestZ >= map.Depth) nearestZ = map.Depth-1

    $cursor.hover.x = nearestX
    $cursor.hover.z = nearestZ
  }

  function getNearestFromMouse(e: MouseEvent): [number, number, number] {
    let r = mapEl.getBoundingClientRect()

    let hitX = (e.clientX - r.left + mapEl.scrollLeft) / zoom
    let hitY = (e.clientY - r.top + mapEl.scrollTop) / zoom

    let xOffset = $cursor.hover.y * -animationsConfig.YStep.X
    let yOffset = $cursor.hover.y * animationsConfig.YStep.Y + (map.Height * -animationsConfig.YStep.Y)

    let nearestX = Math.floor((hitX + xOffset) / animationsConfig.TileWidth)
    let nearestZ = Math.floor((hitY - yOffset) / animationsConfig.TileHeight)

    if (nearestX < 0) nearestX = 0
    if (nearestZ < 0) nearestZ = 0
    if (nearestX >= map.Width) nearestX = map.Width-1
    if (nearestZ >= map.Depth) nearestZ = map.Depth-1

    return [$cursor.hover.y, nearestX, nearestZ]
  }

  function getCoordinateBox(start: Coordinate, end: Coordinate): Coordinate[] {
    let coords: Coordinate[] = []
    let minY = Math.min(start.y, end.y)
    let maxY = Math.max(start.y, end.y)
    let minX = Math.min(start.x, end.x)
    let maxX = Math.max(start.x, end.x)
    let minZ = Math.min(start.z, end.z)
    let maxZ = Math.max(start.z, end.z)
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          coords.push({y, x, z, i: 0})
        }
      }
    }
    return coords
  }

  type KeysState = {[key: string]: boolean}

  function adjustShape(base: Coordinate[], coords: Coordinate[], keys: KeysState) {
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

  function adjustSelection(coords: Coordinate[], keys: KeysState) {
    $cursor.selected = adjustShape($cursor.selected, coords, keys)
  }

  function handleMapMousedown(e: MouseEvent) {
    if (e.buttons === 1) {
      $cursor.start.y = $cursor.hover.y
      $cursor.start.x = $cursor.hover.x
      $cursor.start.z = $cursor.hover.z
      startMouseDrag(e, (t: TraversedTile) => {
        $cursor.end.y = $cursor.hover.y
        $cursor.end.x = $cursor.hover.x
        $cursor.end.z = $cursor.hover.z
        $cursor.selecting = getCoordinateBox($cursor.start, $cursor.end)
      }, (t: TraversedTile[], e: MouseEvent) => {
        $cursor.selecting = []
        adjustSelection(getCoordinateBox($cursor.start, $cursor.end), {
          alt: e.altKey,
          shift: e.shiftKey,
          ctrl: e.ctrlKey,
          meta: e.metaKey,
        })
        let y = $cursor.start.y
        let x = $cursor.start.x
        let z = $cursor.start.z
        $cursor.start.y = $cursor.end.y
        $cursor.start.x = $cursor.end.x
        $cursor.start.z = $cursor.end.z
        $cursor.end.y = y
        $cursor.end.x = x
        $cursor.end.z = z
      })
    } else if (e.buttons === 2) {
      e.preventDefault()
      e.stopPropagation()

      if (tool === 'fill') {
        startMouseDrag(e, (t: TraversedTile) => {
        }, (t: TraversedTile[]) => {
          applyTool({
            y: $cursor.hover.y,
            x: $cursor.hover.x,
            z: $cursor.hover.z,
            i: -1,
            initial: true,
          })
        })
      } else if (tool === 'placing') {
        $cursor.start.y = $cursor.hover.y
        $cursor.start.x = $cursor.hover.x
        $cursor.start.z = $cursor.hover.z

        if ($cursor.placing.length > 0 && $cursor.placing[0].arch !== undefined) {
          map.queue()
          for (let c of $cursor.placing) {
            if (c.arch === undefined) continue
            if ($settingsStore.placeRules.clear) {
              map.apply(new MapClearAction({
                y: c.y + $cursor.hover.y,
                x: c.x + $cursor.hover.x,
                z: c.z + $cursor.hover.z,
              }))
            } else if ($settingsStore.placeRules.deduplicate) {
              let tile = getTile(c.y + $cursor.hover.y, c.x + $cursor.hover.x, c.z + $cursor.hover.z)
              if (tile && tile.length > 0) {
                let matches = false
                for (let tileArch of tile) {
                  // FIXME: Do a deep comparison of the arch vs the placing one instead of just comparing archs. Also should probably have a merge or not option, so as to allow replacing the underlying arch, but keeping any uniquely changed properties.
                  if (tileArch.Original.Archs.length === 0) {
                    continue
                  }
                  if (tileArch.Original.Archs.length !== c.arch.Archs.length) {
                    continue
                  }
                  if (c.arch.Archs.reduce((a, b) => a && tileArch.Original.Archs.includes(b), true)) {
                    matches = true
                    break
                  }
                }
                if (matches) {
                  continue
                }
              }
            }
            let compiled: Archetype
            let error: any
            try {
              compiled = compileInJS(cloneObject(c.arch), true)
            } catch(err) {
              compiled = cloneObject(c.arch)
              error = err
            }

            map.apply(new MapInsertAction({
              arch: {
                Original: cloneObject(c.arch),
                Compiled: compiled,
                Error: error,
              },
              y: c.y + $cursor.hover.y,
              x: c.x + $cursor.hover.x,
              z: c.z + $cursor.hover.z,
              i: c.i,
            }))
          }
          map.unqueue()
          mapsStore.set($mapsStore)
        } else {
          $cursor.selected = adjustShape($cursor.selected, $cursor.placing.map(v=>({
            y: v.y + $cursor.hover.y,
            x: v.x + $cursor.hover.x,
            z: v.z + $cursor.hover.z,
            i: v.i + $cursor.hover.i,
          })), { alt: e.altKey, shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey })
        }
        $cursor.placing = []
        swapTool(lastTool)
      } else if (tool === 'wand') {
        $cursor.start.y = $cursor.hover.y
        $cursor.start.x = $cursor.hover.x
        $cursor.start.z = $cursor.hover.z
        startMouseDrag(e, (t: TraversedTile) => {
        }, (t: TraversedTile[], e: MouseEvent) => {
          let targetTile = t[t.length-1]
          let tile = map.Tiles[targetTile.y][targetTile.x][targetTile.z]
          $cursor.selected = adjustShape($cursor.selected, getMatchingTiles(t[t.length-1], tile.map(v=>{
            let m: ArchMatcher = {}
            // TODO: if MatchArchs
            if ($settingsStore.wandRules.shouldMatchArchetypes) {
              if ($settingsStore.wandRules.matchArchetypes) {
                m.archs = $settingsStore.wandRules.matchArchetypes.split(',')
              } else if (v.Original.Archs.length) {
                m.archs = v.Original.Archs
              }
            }

            if ($settingsStore.wandRules.shouldMatchName) {
              if ($settingsStore.wandRules.matchName) {
                m.name = $settingsStore.wandRules.matchName
              } else if (v.Compiled.Name !== undefined) {
                m.name = v.Compiled.Name
              }
            }

            if ($settingsStore.wandRules.shouldMatchType) {
              if ($settingsStore.wandRules.matchType) {
                m.type = $settingsStore.wandRules.matchType
              } else if (v.Compiled.Type !== undefined) {
                m.type = v.Compiled.Type
              }
            }
            return m
          })).filter(v=>v.matched), {
            shift: e.shiftKey,
            ctrl: e.ctrlKey,
          })
        })
      } else {
        map.queue()
        startMouseDrag(e, (t: TraversedTile) => {
          if (t.initial) {
            applyTool(t)
          }
        }, (t: TraversedTile[]) => {
          map.unqueue()
          mapsStore.set($mapsStore)
        })
      }
    }
  }

  function getMatchingTiles(t: TraversedTile, matchers: ArchMatcher[]): CoordinateMatch[] {
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
      if ($settingsStore.wandRules.matchY) {
        getCoord(y-1, x, z)
        getCoord(y+1, x, z)
      }
      // Left, right
      if ($settingsStore.wandRules.matchX) {
        getCoord(y, x-1, z)
        getCoord(y, x+1, z)
      }
      // Top, bottom
      if ($settingsStore.wandRules.matchZ) {
        getCoord(y, x, z-1)
        getCoord(y, x, z+1)
      }

      if ($settingsStore.wandRules.diagonal) {
        if ($settingsStore.wandRules.matchX && $settingsStore.wandRules.matchY) {
          getCoord(y-1, x-1, z)
          getCoord(y+1, x-1, z)
          getCoord(y+1, x+1, z)
          getCoord(y-1, x+1, z)
        }
        if ($settingsStore.wandRules.matchX && $settingsStore.wandRules.matchZ) {
          getCoord(y, x-1, z-1)
          getCoord(y, x-1, z+1)
          getCoord(y, x+1, z+1)
          getCoord(y, x+1, z-1)
        }
        if ($settingsStore.wandRules.matchY && $settingsStore.wandRules.matchZ) {
          getCoord(y-1, x, z-1)
          getCoord(y-1, x, z+1)
          getCoord(y+1, x, z+1)
          getCoord(y+1, x, z-1)
        }
      }

      // TODO: up, down, as well as diagonals
    }

    getCoord(t.y, t.x, t.z)

    return coords
  }

  function applyTool(t: TraversedTile) {
    if (tool === 'insert') {
      insert($palette.focused, t.y, t.x, t.z, t.i)
      mapsStore.set($mapsStore)
    } else if (tool === 'fill') {
      map.queue()
      if ($cursor.selected.length <= 1) {
        // Flood fill if we only have 1 tile selected.
        // FIXME: Use a match based upon the hover tile!
        let tiles = getMatchingTiles(t, []).filter(v=>v.matched)
        for (let t of tiles) {
          insert($palette.focused, t.y, t.x, t.z, -1)
        }
      } else {
        // Otherwise fill the selection.
        for (let t of $cursor.selected) {
          insert($palette.focused, t.y, t.x, t.z, -1)
        }
      }
      map.unqueue()
      mapsStore.set($mapsStore)
    } else if (tool === 'erase') {
      removeArchetype(t.y, t.x, t.z, t.i)
    }
  }

  function erase(coords: Coordinate[]) {
    map.queue()
    for (let c of coords) {
      for (let i = map.Tiles[c.y][c.x][c.z].length-1; i >= 0; i--) {
        if (c.y < 0 || c.x < 0 || c.z < 0) return
        if (c.y >= map.Height || c.x >= map.Width || c.z >= map.Depth) return
        map.apply(new MapRemoveAction({
          y: c.y, x: c.x, z: c.z, i,
        }))
      }
    }
    map.unqueue()
    mapsStore.set($mapsStore)
  }

  interface TraversedTile {
    y: number
    x: number
    z: number
    i: number
    initial: boolean
  }
  let traversedTiles: TraversedTile[] = []
  function startMouseDrag(e: MouseEvent, cb1: (t: TraversedTile, e?: MouseEvent) => void, cb2: (t: TraversedTile[], e?: MouseEvent) => void) {
    let [y, x, z] = getNearestFromMouse(e)
    traversedTiles.push({y, x, z, i: -1, initial: true})
    cb1(traversedTiles[traversedTiles.length-1], e)

    const handleMouseUp = (e: MouseEvent) => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', handleMouseMove)

      cb2(traversedTiles, e)

      traversedTiles = []
    }
    const handleMouseMove = (e: MouseEvent) => {
      let [y, x, z] = getNearestFromMouse(e)
      if (!traversedTiles.find(v=>v.y===y&&v.x===x&&v.z===z)) {
        traversedTiles.push({y, x, z, i: -1, initial: true})
        cb1(traversedTiles[traversedTiles.length-1], e)
      } else {
        cb1({y, x, z, i: -1, initial: false}, e)
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleMouseMove)
  }

  function undo() {
    mapsStore.update(((v: MapsStoreData) => {
      let mc = v.maps.find(v=>v===mapsContainer)
      if (mc) {
        let m = mc.Maps[mapsContainer.SelectedMap]
        if (m) {
          m.undo()
        }
        focusedArchetypeContainer = m.Tiles[focusedY]?.[focusedX]?.[focusedZ]?.[focusedI]
      }
      return v
    }))
  }

  function redo() {
    mapsStore.update(((v: MapsStoreData) => {
      let mc = v.maps.find(v=>v===mapsContainer)
      if (mc) {
        let m = mc.Maps[mapsContainer.SelectedMap]
        if (m) {
          m.redo()
        }
        focusedArchetypeContainer = m.Tiles[focusedY]?.[focusedX]?.[focusedZ]?.[focusedI]
      }
      return v
    }))
  }

  async function save() {
    let m = {
      Path: mapsContainer.Path,
      Maps: {},
    }
    for (let [k, v] of Object.entries(mapsContainer.Maps)) {
      m.Maps[k] = v.export()
    }

    let err = await SaveMap(m as main.MapReference)
    if (err) {
      // TODO: POPUP ERROR!
      console.log(err)
    }
  }

  function setArchFromEditor(arch: Archetype, y: number, x: number, z: number, i: number) {
    map.apply(new MapSetArchetypeAction({
      y, x, z, i, arch
    }))
    mapsStore.set($mapsStore)
    if (y === focusedY && x === focusedX && z === focusedZ && i === focusedI) {
      focusedArchetypeContainer = map.Tiles[focusedY]?.[focusedX]?.[focusedZ]?.[focusedI]
    }
  }

  function insert(arch: string, y: number, x: number, z: number, p: number) {
    if (y < 0 || x < 0 || z < 0) return
    if (y >= map.Height || x >= map.Width || z >= map.Depth) return

    if ($settingsStore.insertRules.checkForReplace) {
      let rules = $settingsStore.insertRules
      let tile = getTile(y, x, z)
      if (tile.length > 0) {
        let checks = 0
        let fails = 0
        if (rules.shouldMatchArchetypes) {
          checks++
          if (!tile[tile.length-1].Compiled.Archs?.find(v=>rules.matchArchetypes.split(',').includes(v))) {
            fails++
          }
        }
        if (rules.shouldMatchName) {
          checks++
          let r = new RegExp(rules.matchName)
          if (!r.test(tile[tile.length-1].Compiled.Name)) {
            fails++
          }
        }
        if (rules.shouldMatchType) {
          checks++
          let r = new RegExp(rules.matchType)
          if (!r.test(tile[tile.length-1].Compiled.Type)) {
            fails++
          }
        }
        
        if (checks !== 0 && fails === 0) {
          map.apply(new MapReplaceAction({
            y: y,
            x: x,
            z: z,
            i: tile.length-1,
            replace: rules.replaceMode==='replace',
            archName: $palette.focused,
          }))
          return
        } else if (!rules.insertOnNoMatch && checks > 0 && fails > 0) {
          return
        }
      } else if (!rules.insertOnNoMatch) {
        return
      }
    }
    map.apply(new MapInsertAction({
      arch: {
        Original: { Archs: [arch] },
        Compiled: compileInJS({Archs: [arch]}, true),
        Error: null,
      },
      y: y,
      x: x,
      z: z,
      i: p,
    }))
  }

  function insertArchetype(arch: string, y: number, x: number, z: number, p: number) {
    if (y < 0 || x < 0 || z < 0) return
    if (y >= map.Height || x >= map.Width || z >= map.Depth) return
    mapsStore.update(((v: MapsStoreData) => {
      insert(arch, y, x, z, p)
      return v
    }))
  }

  function removeArchetype(y: number, x: number, z: number, i: number) {
    if (y < 0 || x < 0 || z < 0) return
    if (y >= map.Height || x >= map.Width || z >= map.Depth) return
    mapsStore.update(((v: MapsStoreData) => {
      let mc = v.maps.find(v=>v===mapsContainer)
      if (mc) {
        let m = mc.Maps[mapsContainer.SelectedMap]
        if (m) {
          if (i === -1) {
            i = m.Tiles[y][x][z].length-1
          }
          if (i !== -1) {
            m.apply(new MapRemoveAction({
              y, x, z, i,
            }))
          }
        }
      }
      return v
    }))
  }

  function getTile(y: number, x: number, z: number): ArchetypeContainer[]|null {
    if (y < 0 || x < 0 || z < 0) return null
    if (y >= map.Height || x >= map.Width || z >= map.Depth) return null
    return map.Tiles[y][x][z]
  }

  function replaceSelection(ev: CustomEvent) {
    let rules: ReplaceRules = ev.detail as ReplaceRules

    // First collect all our coordinates.
    let coords = $cursor.selected
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

    map.queue()
    for (let c of coords) {
      map.apply(new MapReplaceAction({
        y: c.y,
        x: c.x,
        z: c.z,
        i: c.i,
        replace: rules.replaceMode==='replace',
        archName: $palette.focused,
      }))
    }
    map.unqueue()
    mapsStore.set($mapsStore)
  }

  function trimShape(c: Coordinate[]): Coordinate[] {
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

  function copyShape() {
    $blueprints.shape = trimShape($cursor.selected)
  }
  function pasteShape() {
    if ($blueprints.shape.length > 0) {
      $cursor.placing = $blueprints.shape
      swapTool('placing')
    }
  }

  function copySelection() {
    $blueprints.shape = trimShape(getShapeArchs($cursor.selected))
  }
  function pasteSelection() {
    if ($blueprints.shape.length > 0) {
      $cursor.placing = $blueprints.shape
      swapTool('placing')
    }
  }

  function getShapeArchs(shape: Coordinate[]): Coordinate[] {
    let coords: Coordinate[] = []
    for (let c of shape) {
      let tile = getTile(c.y, c.x, c.z)
      for (let i = 0; i < tile.length; i++) {
        if (coords.find(v=>v.x===c.x&&v.y===c.y&&v.z===c.z&&v.i===c.i)) continue
        coords.push({
          ...c,
          i,
          arch: cloneObject(tile[i].Original),
        })
      }
    }
    return coords
  }

  function swapTool(t: ToolType) {
    lastTool = tool
    tool = t
  }

  function setViewMode(v: ViewMode) {
    viewMode = v
  }

  let goModeOpen: boolean = false
  let goModeWhich: 'Y' | 'X' | 'Z' = 'Y'
  let goModeValue: number
  function openGoMode(which: 'Y'|'X'|'Z') {
    binds.deactivate()
    goModeOpen = true
    goModeValue = undefined
    goModeWhich = which
  }
  function closeGoMode(apply=false) {
    if (apply === true) {
      if (goModeWhich === 'Y') {
        $cursor.hover.y = Math.max(0, Math.min(goModeValue, map.Height-1))
      }
      if (goModeWhich === 'X') {
        $cursor.hover.x = Math.max(0, Math.min(goModeValue, map.Width-1))
      }
      if (goModeWhich === 'Z') {
        $cursor.hover.z = Math.max(0, Math.min(goModeValue, map.Depth-1))
      }
    }
    goModeOpen = false
    binds.activate()
  }
  function onGoModeChange(e: InputEvent) {
    closeGoMode(true)
  }
  function onGoModeKeyup(e: KeyboardEvent) {
    if (e.key == 'Enter' || e.key === ' ') {
      closeGoMode(true)
    } else if (e.key == 'Escape') {
      closeGoMode()
    }
  }

  let scrolling: boolean = false
  let scrollX = 0
  let scrollY = 0
  function dragScroll(node: HTMLElement, callback: any) {
		const onmousedown = (event: MouseEvent) => {
			if (event.which !== 2) return;
      event.stopPropagation()
			event.preventDefault();
      scrollX = event.clientX
      scrollY = event.clientY
			scrolling = true;

      mapEl.requestPointerLock()

			const onmouseup = () => {
        document.exitPointerLock()
				scrolling = false;

				window.removeEventListener('mousemove', callback, false);
				window.removeEventListener('mouseup', onmouseup, false);
			};

			window.addEventListener('mousemove', callback, false);
			window.addEventListener('mouseup', onmouseup, false);
		}

		node.addEventListener('mousedown', onmousedown, false);

		return {
			destroy() {
				node.removeEventListener('mousedown', onmousedown, false);
			}
		};
  }
  function updateScroll(event: MouseEvent) {
    mapEl.scrollLeft -= event.clientX - scrollX
    mapEl.scrollTop -= event.clientY - scrollY
    scrollX = event.clientX
    scrollY = event.clientY
  }

</script>

<div class='main' style={Object.entries($styles.colors).map(v=>`--${v[0]}: ${v[1]}`).join(';\n')}>
  <SplitPane type='horizontal' pos={20}>
    <section slot=a class='toolbar'>
      <article class='toolbar__items'>
        <button class:-active={tool==='insert'} on:click={commands.swapToInsert.cb} title={commands.swapToInsert.keys().join(',')}>
          <img src={insertIcon} alt='insert'>
        </button>
        <button class:-active={tool==='fill'} on:click={commands.swapToFill.cb} title={commands.swapToFill.keys().join(',')}>
          <img src={fillIcon} alt='fill'>
        </button>
        <button class:-active={tool==='erase'} on:click={commands.swapToErase.cb} title={commands.swapToErase.keys().join(',')}>
          <img src={eraserIcon} alt='erase'>
        </button>
        <button class:-active={tool==='wand'} on:click={commands.swapToWand.cb} title={commands.swapToWand.keys().join(',')}>
          <img src={wandIcon} alt='wand'>
        </button>
      </article>
      <fieldset>
        <legend>Tool</legend>
        <ToolSettingsSection tool={tool}/>
      </fieldset>
      <fieldset>
        <legend>Selection</legend>
        <ShapesSection on:copyShape={copyShape} on:pasteShape={pasteShape} on:copySelection={copySelection} on:pasteSelection={pasteSelection}/>
        <ReplaceSection on:replace={replaceSelection} />
      </fieldset>
    </section>
    <section slot=b class='view'>
      {#if map}
        <Menus>
          <MenuBar>
            <MenuItem on:click={commands.save.cb} title={commands.save.keys().join(',')}>
              <img src={saveIcon} alt='save'>
            </MenuItem>
            <MenuItem disabled={!map.undoable} on:click={commands.undo.cb} title={commands.undo.keys().join(',')}>
              <img src={undoIcon} alt='undo'>
            </MenuItem>
            <MenuItem disabled={!map.redoable} on:click={commands.redo.cb} title={commands.redo.keys().join(',')}>
              <img src={redoIcon} alt='redo'>
            </MenuItem>
            <MenuItem on:click={commands.focusMap.cb} highlighted={viewMode==='map'} title={commands.focusMap.keys().join(',')}>
              <img src={mapIcon} alt='map'>
            </MenuItem>
            <MenuItem on:click={commands.focusProperties.cb} highlighted={viewMode==='properties'} title={commands.focusProperties.keys().join(',')}>
              <img src={propertiesIcon} alt='properties'>
            </MenuItem>
            <MenuItem on:click={commands.focusScripts.cb} highlighted={viewMode==='scripts'} title={commands.focusScripts.keys().join(',')}>
              <img src={scriptIcon} alt='scripts'>
            </MenuItem>
          </MenuBar>
        </Menus>
        <section class='map'>
          <SplitPane type='horizontal' pos={80}>
            <article slot=a bind:this={mapEl} class='map__container' on:mousemove={handleMapMousemove} on:wheel={handleMapMousewheel} on:mousedown={handleMapMousedown} on:contextmenu|stopPropagation|preventDefault={_=>{}} use:dragScroll={updateScroll}>
              <Canvas cursor={cursor} map={map} zoom={zoom}></Canvas>
              {#if goModeOpen}
                <div class='go-mode'>
                  <label>
                    <span>{goModeWhich}</span>
                    <input type='number' autofocus={true} placeholder={goModeWhich==='Y'?($cursor.start.y):goModeWhich==='X'?($cursor.start.x):($cursor.start.z)} bind:value={goModeValue} on:change={onGoModeChange} on:keyup={onGoModeKeyup} on:blur={closeGoMode}>
                  </label>
                </div>
              {/if}
            </article>
            <aside slot=b class='archlist'>
              <SplitPane type='vertical' pos={50}>
                <TilesList slot=a cursor={cursor} map={map}></TilesList>
                <ArchPreEditor slot=b on:apply={e=>setArchFromEditor(e.detail, $cursor.start.y, $cursor.start.x, $cursor.start.z, $cursor.start.i)} arch={focusedArchetypeContainer}></ArchPreEditor>
              </SplitPane>
            </aside>
          </SplitPane>
          {#if viewMode === 'properties'}
            <div transition:fade class='dialog' on:click={_=>showProperties=false}>
              <PropertiesEditor bind:map={map}></PropertiesEditor>
            </div>
          {:else if viewMode === 'scripts'}
            <div transition:fade class='dialog' on:click={_=>showScripts=false}>
              <ScriptsEditor bind:map={map}></ScriptsEditor>
            </div>
          {/if}
        </section>
        <footer>
          <div class='map__dimensions'>
            <span>{map.Width}</span>
            <span>{map.Height}</span>
          </div>
          <div class='map__cursor'>
            <span>
              <span class='cursor__text'>{$cursor.start.y}</span>
              <span class='hover__text'>({$cursor.hover.y})</span>
            </span>
            <span>
              <span class='cursor__text'>{$cursor.start.x}</span>
              <span class='hover__text'>({$cursor.hover.x})</span>
            </span>
            <span>
              <span class='cursor__text'>{$cursor.start.z}</span>
              <span class='hover__text'>({$cursor.hover.z})</span>
            </span>
          </div>
        </footer>
      {:else}
        select a map
      {/if}
    </section>
  </SplitPane>
</div>

<style>
  .main {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
  .dialog {
    position: absolute;
    width: 100%;
    height: 100%;
    background: var(--subsection);
    color: var(--subsection-color);
    overflow: auto;
  }
  .toolbar {
    display: flex;
    flex-direction: column;
  }
  .toolbar button {
    min-width: 2em;
    min-height: 2em;
    border-radius: 0;
    background: transparent;
    border-style: none;
    display: inline-grid;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
  }
  .toolbar button.-active {
    background: rgba(128, 128, 128, 0.5);
  }
  .wand_settings {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  .view {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  .map {
    position: relative;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: minmax(0, 1fr) auto;
    overflow: hidden;
  }
  .map__container {
    overflow: scroll;
    text-align: left;
    cursor: crosshair;
    background: black;
  }
  aside {
    min-width: 4em;
  }
  .archlist {
    display: grid;
  }
  footer {
    display: grid;
    grid-template-columns: auto auto auto;
    align-items: flex-start;
    background: var(--subsection);
    color: var(--subsection-color);
  }
  .map__dimensions {
    display: grid;
    grid-template-columns: 2em 2em;
  }
  .map__cursor {
    display: grid;
    grid-template-columns: 4em 4em 4em 4em;
    align-items: flex-start;
    text-align: left;
  }
  .cursor__text {
    color: var(--cursorBorder);
  }
  .hover__text {
    color: var(--hoverBorder);
  }
  .go-mode {
    display: absolute;
    position: 0;
    top: 0;
  }
</style>