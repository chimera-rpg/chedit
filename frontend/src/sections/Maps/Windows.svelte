<script lang="ts">
  import { maps } from '../../stores/maps'
  import MapWindow from './MapWindow.svelte'
  import Windows from '../../components/Windows/Windows.svelte'
</script>

<div>
  <Windows>
    {#each $maps.maps as group (group.id)}
      <MapWindow bind:map={group}></MapWindow>
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