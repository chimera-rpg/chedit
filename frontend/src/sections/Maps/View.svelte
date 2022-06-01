<script lang='ts'>
  import type { main, data } from '../../../wailsjs/go/models'
  import Tile from './Tile.svelte'

  export let map: data.Map
  let zoom: number = 4

</script>

<div>
  {#if map}
    <section>
      <article class='map__container'>
        <article class='map' style="width: {map.Width*8*zoom}px; height: {map.Height*8*zoom}px">
          {#each map.Tiles as tileY, y}
            {#each tileY as tileX, x}
              {#each tileX as tileZ, z}
                <Tile y={y} x={x} z={z} tile={tileZ} map={map} zoom={zoom}></Tile>
              {/each}
            {/each}
          {/each}
        </article>
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
  }
  .map {
    position: relative;
  }
  article {
    background: black;
  }
  aside {
    min-width: 4em;
  }
</style>