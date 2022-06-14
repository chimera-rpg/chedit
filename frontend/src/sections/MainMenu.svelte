<script lang='ts'>
  import Menus from "../components/Menus/Menus.svelte"
  import MenuBar from "../components/Menus/MenuBar.svelte"
  import MenuList from "../components/Menus/MenuList.svelte"
  import MenuItem from "../components/Menus/MenuItem.svelte"
  import { LoadMap, GetArchetypes, GetAnimations, GetAnimationsConfig, LoadAnimations, LoadAnimationsConfig } from "../../wailsjs/go/main/Editor"
  import { collectArchetypes, compileArchetypes, localArchetypes, getArchetypes } from '../models/archs'
  import { maps as mapsStore } from '../stores/maps'
  import { animations as animationStore } from '../stores/animations'
  import { archetypes as archetypesStore } from '../stores/archetypes'
  import { setAnimationsConfig } from '../models/config'
  import { parse } from 'yaml'
  import type { main } from '../../wailsjs/go/models'
  import { createMap, loadMapsFromYAML } from '../models/maps'
  import type { MapsContainer } from '../interfaces/Map'

  async function openMap() {
    if (false) { // This unmarshals the maps in go, then sends those here.
      let m = await LoadMap(true) as main.MapReference
      mapsStore.open(m)
    } else { // This only reads the bytes in go, then sends them here to unmarshal.
      let mr = await LoadMap(false) as main.MapReference
      let m = loadMapsFromYAML(mr.Source)
      mapsStore.open({
        Path: mr.Path,
        SelectedMap: "",
        Maps: m,
      })
    }
  }

  function newMap() {
    let mr: MapsContainer = {
      Path: '',
      SelectedMap: 'map',
      Maps: {
        'map': createMap(),
      }
    }
    mapsStore.open(mr)
  }

  async function refreshAssets() {
    try {
      await collectArchetypes()
      compileArchetypes()
      let archetypes = getArchetypes()
      archetypesStore.set({archetypes, tree: {}})
    } catch(err: any) {
      console.error('archetypes', err)
    }
    try {
      await LoadAnimationsConfig()
      await LoadAnimations()

      let animationConfig = await GetAnimationsConfig()
      setAnimationsConfig(animationConfig)

      let animations = await GetAnimations()
      animationStore.set({animations, tree: {}, images: {}})
    } catch(err: any) {
      console.error('animations', err)
    }
  }
</script>

<nav>
  <Menus>
    <MenuBar>
      <MenuItem popup='map-menu'>
        Maps
        <MenuList popup='map-menu'>
          <MenuItem on:click={newMap}>
            New
          </MenuItem>
          <MenuItem on:click={openMap}>
            Open...
          </MenuItem>
        </MenuList>
      </MenuItem>
      <MenuItem popup='tool-menu'>
        Tools
        <MenuList popup='tool-menu'>
          <MenuItem on:click={refreshAssets}>
            Refresh Assets
          </MenuItem>
        </MenuList>
      </MenuItem>
    </MenuBar>
  </Menus>
</nav>

<style>
  nav {
    background: var(--main-menu);
  }
</style>