<script lang='ts'>
  import { animationsConfig } from '../../models/config'

  import type { main, data } from '../../../wailsjs/go/models'
  import Canvas from './Canvas.svelte'
  import SplitPane from '../../components/SplitPane.svelte'

  export let map: data.Map
  let zoom: number = 2
  let cursorY: number = 0
  let cursorX: number = 0
  let cursorZ: number = 0

  let hoverX: number = 0
  let hoverY: number = 0

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

    let hitX = (e.clientX - r.left + mapEl.scrollLeft) / zoom
    let hitY = (e.clientY - r.top + mapEl.scrollTop) / zoom

    let xOffset = cursorY * -animationsConfig.YStep.X
    let yOffset = cursorY * animationsConfig.YStep.Y + (map.Height * -animationsConfig.YStep.Y)

    let nearestX = Math.floor((hitX + xOffset) / animationsConfig.TileWidth)
    let nearestZ = Math.floor((hitY - yOffset) / animationsConfig.TileHeight)

    if (nearestX < 0) nearestX = 0
    if (nearestZ < 0) nearestZ = 0
    if (nearestX > map.Width) nearestX = map.Width
    if (nearestZ > map.Depth) nearestZ = map.Depth

    cursorX = nearestX
    cursorZ = nearestZ

    /*let [hX, hY] = getPos(cursorY, nearestX, nearestZ)
    hoverY = hY - (mapEl.scrollTop / zoom)
    hoverX = hX*/
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
      <SplitPane type='horizontal' pos={80}>
        <article slot=a bind:this={mapEl} class='map__container' on:mousemove={handleMapMousemove} on:wheel={handleMapMousewheel}>
          <Canvas cursor={[cursorY, cursorX, cursorZ]} map={map} zoom={zoom}></Canvas>
        </article>
        <aside slot=b>
          tiles
        </aside>
      </SplitPane>
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
    pointer-events: none;
  }
  article {
    background: black;
  }
  aside {
    min-width: 4em;
  }
</style>