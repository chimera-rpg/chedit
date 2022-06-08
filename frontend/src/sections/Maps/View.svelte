<script lang='ts'>
  import { animationsConfig } from '../../models/config'
  import { styles } from '../../stores/styles'

  import type { main, data } from '../../../wailsjs/go/models'
  import Canvas from './Canvas.svelte'
  import SplitPane from '../../components/SplitPane.svelte'
  import TilesList from './TilesList.svelte'
  import type { MapsContainer } from '../../interfaces/Map'

  export let map: MapsContainer
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
    if (scrolling) return
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
    if (e.which !== 1) return
    cursorY = hoverY
    cursorX = hoverX
    cursorZ = hoverZ
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

<div style={Object.entries($styles.colors).map(v=>`--${v[0]}: ${v[1]}`).join(';\n')}>
  {#if map}
    <section>
      <SplitPane type='horizontal' pos={80}>
        <article slot=a bind:this={mapEl} class='map__container' on:mousemove={handleMapMousemove} on:wheel={handleMapMousewheel} on:mousedown={handleMapMousedown} use:dragScroll={updateScroll}>
          <Canvas cursorY={cursorY} cursorX={cursorX} cursorZ={cursorZ} hoverY={hoverY} hoverX={hoverX} hoverZ={hoverZ} map={map} zoom={zoom}></Canvas>
        </article>
        <aside slot=b>
          <TilesList y={cursorY} x={cursorX} z={cursorZ} map={map}></TilesList>
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