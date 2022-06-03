<script lang='ts'>
  import Menus from "../components/Menus/Menus.svelte"
  import MenuBar from "../components/Menus/MenuBar.svelte"
  import MenuList from "../components/Menus/MenuList.svelte"
  import MenuItem from "../components/Menus/MenuItem.svelte"
  import { LoadMap, GetArchetypes, GetAnimations, GetAnimationsConfig } from "../../wailsjs/go/main/Editor"
  import { maps as mapsStore } from '../stores/maps'
  import { animations as animationStore } from '../stores/animations'
  import { archetypes as archetypesStore } from '../stores/archetypes'
  import { setAnimationsConfig } from '../models/config'
  import { parse } from 'yaml'

  async function openMap() {
    if (true) { // This unmarshals the maps in go, then sends those here.
      let m = await LoadMap(true)
      mapsStore.open(m)
    } else { // This only reads the bytes in go, then sends them here to unmarshal.
      let m = await LoadMap(false)
      m.Maps = parse(m.Source)
      mapsStore.open(m)
    }
  }

  async function refreshAssets() {
    try {
      let archetypes = await GetArchetypes()
      archetypesStore.set({archetypes, tree: {}})
    } catch(err: any) {
      console.error('archetypes', err)
    }
    try {
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