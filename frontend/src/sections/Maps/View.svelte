<script lang='ts'>
  import { animationsConfig } from '../../models/config'

  import type { main, data } from '../../../wailsjs/go/models'
  import Tile from './Tile.svelte'
import Canvas from './Canvas.svelte'

  export let map: data.Map
  let zoom: number = 2
  let cursorY: number = 0
  let cursorX: number = 0
  let cursorZ: number = 0

  let hoverX: number = 0
  let hoverY: number = 0

  function handleTileMousedown(e: MouseEvent, y: number, x: number, z: number) {
    cursorX = x
    cursorZ = z
  }
  function handleMapMousewheel(e: WheelEvent) {
    if (e.altKey) {
      e.preventDefault()
      e.stopPropagation()
      cursorY += e.deltaY > 0 ? -1 : 1
      if (cursorY < 0) cursorY = 0
      if (cursorY > map.Height) cursorY = map.Height
    } else if (e.ctrlKey) {
      e.preventDefault()
      e.stopPropagation()
      zoom += e.deltaY > 0 ? -1 : 1
      if (zoom < 1) zoom = 1
    }
  }

  let mapEl: HTMLElement = null
  function handleMapMousemove(e: MouseEvent) {
    e.stopImmediatePropagation()
    e.stopPropagation()
    e.preventDefault()

    let r = mapEl.getBoundingClientRect()

    let hitX = (e.clientX + mapEl.scrollLeft - r.left) / zoom
    let hitY = (e.clientY + mapEl.scrollTop - r.top) / zoom

    let xOffset = cursorY * -animationsConfig.YStep.X
    let yOffset = cursorY * animationsConfig.YStep.Y + (map.Height * -animationsConfig.YStep.Y)

    let nearestX = Math.round((hitX + xOffset) / animationsConfig.TileWidth - 1)
    let nearestY = Math.round((hitY - yOffset) / animationsConfig.TileHeight)

    let [hX, hY] = getPos(cursorY, nearestX, nearestY)
    hoverY = hY
    hoverX = hX
  }

  function getPos(y: number, x: number, z: number): [number, number, number] {
    let yStep = {
      X: animationsConfig.YStep.X,
      Y: animationsConfig.YStep.Y,
    }

    let originX = 0
    let originY = map.Height * -yStep.Y
    //let originY = 0
    originX += y * yStep.X
    originY += y * yStep.Y

    originX += x * animationsConfig.TileWidth
    originY += z * animationsConfig.TileHeight

    let indexZ = z
    let indexX = x
    let indexY = y
    let zIndex = (indexZ * map.Height * map.Width) + (map.Depth * indexY) - indexX

    // TODO: Get frame x, y offset

    return [originX, originY, zIndex]
  }

</script>

<div>
  {#if map}
    <section>
      <article bind:this={mapEl} class='map__container' on:mousemove={handleMapMousemove}  on:wheel={handleMapMousewheel}>
        <Canvas map={map} zoom={zoom}></Canvas>
        <!--<article class='map' style="width: {map.Width*8*zoom}px; height: {map.Height*8*zoom}px">
          {#each map.Tiles as tileY, y (y)}
            {#each tileY as tileX, x (x)}
              {#each tileX as tileZ, z (z)}
                <Tile y={y} x={x} z={z} tile={tileZ} map={map} zoom={zoom} focused={cursorX===x&&cursorY===y&&cursorZ===z}></Tile>
              {/each}
            {/each}
          {/each}
        </article>-->
        <div class='cursor' style="left: {hoverX*zoom}px; top: {hoverY*zoom}px; width: {animationsConfig.TileWidth*zoom}px; height: {animationsConfig.TileHeight*zoom}px"></div>
      </article>
      <aside>
        tiles
      </aside>
    </section>
    <footer>
      {map.X}x{map.Y}x{map.Width}x{map.Height}
    </footer>
  {:else}
    select a map
  {/if}
</div>

<style>
  div {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
  }
  section {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: minmax(0, 1fr) auto;
    overflow: hidden;
  }
  .map__container {
    overflow: scroll;
    text-align: left;
  }
  .map {
    position: relative;
    pointer-events: none;
  }
  .yLayer {
    position: relative;
  }
  .yLayer.disabled {
    pointer-events: none;
  }
  .cursor {
    position: absolute;
    border: 1px solid white;
    z-index: 9999999;
  }
  article {
    background: black;
  }
  aside {
    min-width: 4em;
  }
</style>