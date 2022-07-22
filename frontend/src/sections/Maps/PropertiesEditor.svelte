<script lang='ts'>
  import type { MapsContainer, ContainerMap, ContainerMaps } from '../../interfaces/Map'

  export let map: ContainerMap
</script>

<div>
  Name: {map.Name}
</div>

<style>
  div {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
</style>