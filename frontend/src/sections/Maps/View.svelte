<script lang='ts'>
  import { animationsConfig } from '../../models/config'
  import { styles } from '../../stores/styles'
  import { fly, slide, scale, blur } from 'svelte/transition'

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

  import eraserIcon from '../../assets/icons/eraser.png'
  import insertIcon from '../../assets/icons/insert.png'
  import fillIcon from '../../assets/icons/fill.png'
  import saveIcon from '../../assets/icons/save.png'
  import undoIcon from '../../assets/icons/undo.png'
  import redoIcon from '../../assets/icons/redo.png'
  import mapIcon from '../../assets/icons/map.png'
  import propertiesIcon from '../../assets/icons/properties.png'
  import scriptIcon from '../../assets/icons/script.png'
  import { Writable, writable } from 'svelte/store'
  import type { Coordinate, Cursor } from '../../interfaces/editor'
  import { blueprints } from '../../stores/blueprints'
  import Menus from '../../components/Menus/Menus.svelte'
  import MenuBar from '../../components/Menus/MenuBar.svelte'
  import MenuItem from '../../components/Menus/MenuItem.svelte'
  import MenuList from '../../components/Menus/MenuList.svelte'

  type ToolType = 'insert'|'erase'|'fill'|'placing'
  let tool: ToolType = 'insert'
  let lastTool: ToolType = 'insert'

  export let mapsContainer: MapsContainer
  export let map: ContainerMap
  export let mapIndex: number
  let zoom: number = 2
  let cursorY: number = 0
  let cursorX: number = 0
  let cursorZ: number = 0

  let cursor: Writable<Cursor> = writable({
    start: {x: 0, y: 0, z: 0},
    end: {x: 0, y: 0, z: 0},
    hover: {x: 0, y: 0, z: 0},
    selected: [],
    selecting: [],
    placing: [],
  })

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
      $cursor.hover.y += (e.shiftKey?e.deltaX:e.deltaY) > 0 ? -1 : 1
      if ($cursor.hover.y < 0) $cursor.hover.y = 0
      if ($cursor.hover.y >= map.Height) $cursor.hover.y = map.Height-1
      if (e.shiftKey) {
        // TODO: Grow/shrink our selection if shift is held.
      }
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
          coords.push({y, x, z})
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
      if (tool === 'placing') {
        $cursor.start.y = $cursor.hover.y
        $cursor.start.x = $cursor.hover.x
        $cursor.start.z = $cursor.hover.z

        $cursor.selected = adjustShape($cursor.selected, $cursor.placing.map(v=>({
          y: v.y + $cursor.hover.y,
          x: v.x + $cursor.hover.x,
          z: v.z + $cursor.hover.z,
        })), { alt: e.altKey, shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey })
        $cursor.placing = []
        swapTool(lastTool)
      } else {
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
      }
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

  function applyTool(t: TraversedTile) {
    if (tool === 'insert') {
      insertArchetype($palette.focused, t.y, t.x, t.z, t.i)
    } else if (tool === 'fill') {
      if ($cursor.selected.length <= 1) {
        // TODO: flood fill based upon some logic.
      } else {
        map.queue()
        for (let t of $cursor.selected) {
          insert($palette.focused, t.y, t.x, t.z, -1)
        }
        map.unqueue()
        mapsStore.set($mapsStore)
      }
    } else if (tool === 'erase') {
      removeArchetype(t.y, t.x, t.z, t.i)
    }
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

  function insert(arch: string, y: number, x: number, z: number, p: number) {
    if (y < 0 || x < 0 || z < 0) return
    if (y >= map.Height || x >= map.Width || z >= map.Depth) return
    map.apply(new MapInsertAction({
      arch: {
        Original: { Archs: [arch] },
        Compiled: compileInJS({Archs: [arch]}, true),
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
  <section class='toolbar'>
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
    <button on:click={copyShape}>
      copy shape
    </button>
    <button on:click={pasteShape}>
      paste shape
    </button>
  </section>
  <section class='view'>
    {#if map}
      <Menus>
        <MenuBar>
          <MenuItem on:click={_=>console.log(map.export())}>
            <img src={saveIcon} alt='save'>
          </MenuItem>
          <MenuItem disabled={!map.undoable} on:click={undo}>
            <img src={undoIcon} alt='undo'>
          </MenuItem>
          <MenuItem disabled={!map.redoable} on:click={redo}>
            <img src={redoIcon} alt='redo'>
          </MenuItem>
          <MenuItem on:click={_=>showProperties=!showProperties}>
            <img src={mapIcon} alt='map'>
          </MenuItem>
          <MenuItem on:click={_=>showProperties=!showProperties}>
            <img src={propertiesIcon} alt='properties'>
          </MenuItem>
          <MenuItem on:click={_=>showScripts=!showScripts}>
            <img src={scriptIcon} alt='scripts'>
          </MenuItem>
        </MenuBar>
      </Menus>
      <section class='map'>
        <SplitPane type='horizontal' pos={80}>
          <article slot=a bind:this={mapEl} class='map__container' on:mousemove={handleMapMousemove} on:wheel={handleMapMousewheel} on:mousedown={handleMapMousedown} on:contextmenu|stopPropagation|preventDefault={_=>{}} use:dragScroll={updateScroll}>
            <Canvas cursor={cursor} map={map} zoom={zoom}></Canvas>
          </article>
          <aside slot=b>
            <TilesList cursor={cursor} map={map}></TilesList>
          </aside>
        </SplitPane>
        {#if showProperties}
          <div transition:slide class='dialog' on:click={_=>showProperties=false}>
            close me
          </div>
        {/if}
        {#if showScripts}
          <div transition:slide class='dialog' on:click={_=>showScripts=false}>
            <textarea>{map.Script}</textarea>
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
</div>

<style>
  .main {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
  .dialog {
    position: absolute;
    width: 100%;
    height: 100%;
    background: var(--subsection);
    color: var(--subsection-color);
  }
  .toolbar {
  }
  .toolbar > button {
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
  .toolbar > button.-active {
    background: rgba(128, 128, 128, 0.5);
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
  }
  article {
    background: black;
  }
  aside {
    min-width: 4em;
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