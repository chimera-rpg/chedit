<script lang='ts'>
  import { animationsConfig } from '../../models/config'
  import { styles } from '../../stores/styles'
  import { fly, slide, scale, blur, fade } from 'svelte/transition'

  import { main, data } from '../../../wailsjs/go/models'
  import Canvas from './Canvas.svelte'
  import SplitPane from '../../components/SplitPane.svelte'
  import TilesList from './TilesList.svelte'
  import type { MapsContainer, ContainerMap, ContainerMaps } from '../../interfaces/Map'
  import { palette } from '../../stores/palette'
  import type { ArchetypeContainer } from '../../interfaces/Archetype'
  import { compileInJS } from '../../models/archs'
  import { maps as mapsStore, MapsStoreData } from '../../stores/maps'
  import { MapInsertAction, MapRemoveAction } from '../../models/maps'
  import { Binds } from '../../models/binds'

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
  import { Writable, writable } from 'svelte/store'
  import type { ArchMatcher, Coordinate, CoordinateMatch, Cursor, WandRules, ToolType } from '../../interfaces/editor'
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
  binds.addHandler('Undo', () => {
    undo()
  })
  binds.addHandler('Redo', () => {
    redo()
  })
  binds.addHandler('Swap to Insert', () => { swapTool('insert')})
  binds.addHandler('Swap to Erase', () => { swapTool('erase')})
  binds.addHandler('Swap to Fill', () => { swapTool('fill')})
  binds.addHandler('Swap to Wand', () => { swapTool('wand')})
  binds.addHandler('Erase Selection', () => { erase($cursor.selected) })

  binds.addShortcut('Undo', ['Control', 'Z'])
  binds.addShortcut('Redo', ['Control', 'Shift', 'Z'])
  binds.addShortcut('Redo', ['Control', 'Y'])
  binds.addShortcut('Swap to Insert', ['1'])
  binds.addShortcut('Swap to Fill', ['2'])
  binds.addShortcut('Swap to Erase', ['3'])
  binds.addShortcut('Swap to Wand', ['4'])
  binds.addShortcut('Erase Selection', ['Delete'])
  binds.addShortcut('Erase Selection', ['Backspace'])

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

 let wandRules: WandRules = {
    shouldMatchArchetypes: true,
    shouldMatchName: false,
    shouldMatchType: false,
    matchArchetypes: '',
    matchName: '',
    matchType: '',
    matchY: false,
    matchX: true,
    matchZ: true,
    diagonal: false,
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
    if (e.button === 0) {
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
    } else if (e.button === 2) {
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

        $cursor.selected = adjustShape($cursor.selected, $cursor.placing.map(v=>({
          y: v.y + $cursor.hover.y,
          x: v.x + $cursor.hover.x,
          z: v.z + $cursor.hover.z,
          i: v.i + $cursor.hover.i,
        })), { alt: e.altKey, shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey })
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
            if (wandRules.shouldMatchArchetypes) {
              if (wandRules.matchArchetypes) {
                m.archs = wandRules.matchArchetypes.split(',')
              } else if (v.Original.Archs.length) {
                m.archs = v.Original.Archs
              }
            }

            if (wandRules.shouldMatchName) {
              if (wandRules.matchName) {
                m.name = wandRules.matchName
              } else if (v.Compiled.Name !== undefined) {
                m.name = v.Compiled.Name
              }
            }

            if (wandRules.shouldMatchType) {
              if (wandRules.matchType) {
                m.type = wandRules.matchType
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

      // TODO: up, down, as well as diagonals
    }

    getCoord(t.y, t.x, t.z)

    return coords
  }

  function applyTool(t: TraversedTile) {
    if (tool === 'insert') {
      insertArchetype($palette.focused, t.y, t.x, t.z, t.i)
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

  function insert(arch: string, y: number, x: number, z: number, p: number) {
    if (y < 0 || x < 0 || z < 0) return
    if (y >= map.Height || x >= map.Width || z >= map.Depth) return
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
      y: v.y - minY,
      x: v.x - minX,
      z: v.z - minZ,
      i: v.i,
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

  function swapTool(t: ToolType) {
    lastTool = tool
    tool = t
  }

  let showProperties: boolean = false
  let showScripts: boolean = false

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
        <button class:-active={tool==='insert'} on:click={_=>tool='insert'}>
          <img src={insertIcon} alt='insert'>
        </button>
        <button class:-active={tool==='fill'} on:click={_=>tool='fill'}>
          <img src={fillIcon} alt='fill'>
        </button>
        <button class:-active={tool==='erase'} on:click={_=>tool='erase'}>
          <img src={eraserIcon} alt='erase'>
        </button>
        <hr>
        <button class:-active={tool==='wand'} on:click={_=>tool='wand'}>
          <img src={wandIcon} alt='wand'>
        </button>
      </article>
      <ToolSettingsSection tool={tool} bind:wandRules={wandRules}/>
      <ShapesSection on:copy={copyShape} on:paste={pasteShape}/>
      <ReplaceSection/>
    </section>
    <section slot=b class='view'>
      {#if map}
        <Menus>
          <MenuBar>
            <MenuItem on:click={_=>save()}>
              <img src={saveIcon} alt='save'>
            </MenuItem>
            <MenuItem disabled={!map.undoable} on:click={undo}>
              <img src={undoIcon} alt='undo'>
            </MenuItem>
            <MenuItem disabled={!map.redoable} on:click={redo}>
              <img src={redoIcon} alt='redo'>
            </MenuItem>
            <MenuItem on:click={_=>viewMode='map'} highlighted={viewMode==='map'}>
              <img src={mapIcon} alt='map'>
            </MenuItem>
            <MenuItem on:click={_=>viewMode='properties'} highlighted={viewMode==='properties'}>
              <img src={propertiesIcon} alt='properties'>
            </MenuItem>
            <MenuItem on:click={_=>viewMode='scripts'} highlighted={viewMode==='scripts'}>
              <img src={scriptIcon} alt='scripts'>
            </MenuItem>
          </MenuBar>
        </Menus>
        <section class='map'>
          <SplitPane type='horizontal' pos={80}>
            <article slot=a bind:this={mapEl} class='map__container' on:mousemove={handleMapMousemove} on:wheel={handleMapMousewheel} on:mousedown={handleMapMousedown} on:contextmenu|stopPropagation|preventDefault={_=>{}} use:dragScroll={updateScroll}>
              <Canvas cursor={cursor} map={map} zoom={zoom}></Canvas>
            </article>
            <aside slot=b class='archlist'>
              <SplitPane type='vertical' pos={50}>
                <TilesList slot=a cursor={cursor} map={map}></TilesList>
                <ArchPreEditor slot=b arch={map.Tiles[$cursor.start.y]?.[$cursor.start.x]?.[$cursor.start.z]?.[$cursor.start.i]}></ArchPreEditor>
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
    display: grid;
    grid-template-columns: minmax(0, 1fr);
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
</style>