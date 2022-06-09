<script lang="ts">
  import { maps } from '../../stores/maps'
  import MapWindow from './MapWindow.svelte'
  import Windows from '../../components/Windows/Windows.svelte'
  import type { main } from '../../../wailsjs/go/models'

  function closeMap(map: main.MapReference) {
    maps.close(map)
  }
</script>

<div>
  <Windows>
    {#each $maps.maps as group, index}
      <MapWindow bind:map={group} mapIndex={index} on:close={_=>closeMap(group)}></MapWindow>
    {/each}
  </Windows>
</div>

<style>
  div {
    position: relative;
    display: flex;
    align-items: flex-start;
    flex-wrap: nowrap;
  }
</style>