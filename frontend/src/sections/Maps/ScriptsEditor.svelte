<script lang='ts'>
  import type { ContainerMap } from '../../interfaces/Map'
  import applyIcon from '../../assets/icons/apply.png'
  import resetIcon from '../../assets/icons/reset.png'
  import Menus from '../../components/Menus/Menus.svelte'
  import MenuBar from '../../components/Menus/MenuBar.svelte'
  import MenuItem from '../../components/Menus/MenuItem.svelte'
  import { MapChangeFieldAction } from '../../models/maps'
  import { maps as mapsStore } from '../../stores/maps'
  import type { MapsStoreData } from '../../stores/maps'
  import { onMount } from 'svelte'

  export let map: ContainerMap

  $: script = map.Script
  $: changed = map.Script !== script

  function reset() {
    script = map.Script
  }
  function apply() {
    map.queue()

    map.apply(new MapChangeFieldAction({
      key: 'Script',
      value: script,
    }))

    map.unqueue()
    // Reset the map store to update all map listeners.
    mapsStore.set($mapsStore)
  }

  onMount(() => {
    let unsub = mapsStore.subscribe((v: MapsStoreData) => {
      // This is lazy, but we find the matching map store map for our map and then refresh our UI accordingly.
      for (let m of v.maps) {
        for (let [k, map2] of Object.entries(m.Maps)) {
          if (map === map2) {
            script = map.Script
            return
          }
        }
      }
    })
    return () => {
      unsub()
    }
  })
</script>

<div>
  <textarea value={script} on:change={e=>script=e.currentTarget.value}/>
  <div class='toolbar'>
    <Menus>
      <MenuBar>
        <MenuItem disabled={!changed} on:click={reset}>
          <img src={resetIcon} alt='reset'>
        </MenuItem>
        <MenuItem disabled={!changed} on:click={apply}>
          <img src={applyIcon} alt='apply'>
        </MenuItem>
      </MenuBar>
    </Menus>
  </div>
</div>

<style>
  div {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
  }
</style>