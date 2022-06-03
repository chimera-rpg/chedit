<script lang='ts'>
  import { animationsConfig } from '../../models/config'
  import { styles } from '../../stores/styles'

  import type { main, data } from '../../../wailsjs/go/models'
  import Canvas from './Canvas.svelte'
  import SplitPane from '../../components/SplitPane.svelte'

  export let map: data.Map
  let zoom: number = 2
  let cursorY: number = 0
  let cursorX: number = 0
  let cursorZ: number = 0

  let hoverY: number = 0
  let hoverX: number = 0
  let hoverZ: number = 0

  function handleMapMousewheel(e: WheelEvent) {
    if (e.altKey) {
      e.preventDefault()
      e.stopPropagation()
      hoverY += e.deltaY > 0 ? -1 : 1
      if (hoverY < 0) hoverY = 0
      if (hoverY > map.Height) hoverY = map.Height
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

    let xOffset = hoverY * -animationsConfig.YStep.X
    let yOffset = hoverY * animationsConfig.YStep.Y + (map.Height * -animationsConfig.YStep.Y)

    let nearestX = Math.floor((hitX + xOffset) / animationsConfig.TileWidth)
    let nearestZ = Math.floor((hitY - yOffset) / animationsConfig.TileHeight)

    if (nearestX < 0) nearestX = 0
    if (nearestZ < 0) nearestZ = 0
    if (nearestX > map.Width) nearestX = map.Width
    if (nearestZ > map.Depth) nearestZ = map.Depth

    hoverX = nearestX
    hoverZ = nearestZ
  }

  function handleMapMousedown(e: MouseEvent) {
    cursorY = hoverY
    cursorX = hoverX
    cursorZ = hoverZ
  }
</script>

<div style={Object.entries($styles.colors).map(v=>`--${v[0]}: ${v[1]}`).join(';\n')}>
  {#if map}
    <section>
      <SplitPane type='horizontal' pos={80}>
        <article slot=a bind:this={mapEl} class='map__container' on:mousemove={handleMapMousemove} on:wheel={handleMapMousewheel} on:mousedown={handleMapMousedown}>
          <Canvas cursor={[cursorY, cursorX, cursorZ]} hover={[hoverY, hoverX, hoverZ]} map={map} zoom={zoom}></Canvas>
        </article>
        <aside slot=b>
          tiles
        </aside>
      </SplitPane>
    </section>
    <footer>
      <div class='map__dimensions'>
        <span>{map.Width}</span>
        <span>{map.Height}</span>
      </div>
      <div class='map__cursor'>
        <span>
          <span class='cursor__text'>{cursorY}</span>
          <span class='hover__text'>({hoverY})</span>
        </span>
        <span>
          <span class='cursor__text'>{cursorX}</span>
          <span class='hover__text'>({hoverX})</span>
        </span>
        <span>
          <span class='cursor__text'>{cursorZ}</span>
          <span class='hover__text'>({hoverZ})</span>
        </span>
      </div>
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
    cursor: crosshair;
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