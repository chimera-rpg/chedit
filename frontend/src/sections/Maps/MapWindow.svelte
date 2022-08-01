<script lang='ts'>
  import { Binds } from '../../models/binds'

  import Window from '../../components/Windows/Window.svelte'
  import type { MapsContainer } from '../../interfaces/Map'
  import View from './View.svelte'

  export let map: MapsContainer
  export let mapIndex: number
  let binds: Binds = new Binds()
</script>

<Window on:close on:mousedown={_=>binds.activate()}>
  <svelte:fragment slot="header">
    <span>{map.Path.split('/').reverse()[0]}</span>
  </svelte:fragment>
  <section>
    <nav>
      {#each Object.entries(map.Maps) as [key] (key)}
        <li>{key}</li>
      {/each}
    </nav>
    <View binds={binds} map={map.Maps[map.SelectedMap]} mapsContainer={map} mapIndex={mapIndex}></View>
  </section>
</Window>

<style>
  nav {
    display: flex;
    flex-wrap: nowrap;
    overflow: auto;
  }
  li {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  section {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
  }
</style>