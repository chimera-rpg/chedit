<script lang='ts'>
  import Menus from "../components/Menus/Menus.svelte"
  import MenuBar from "../components/Menus/MenuBar.svelte"
  import MenuList from "../components/Menus/MenuList.svelte"
  import MenuItem from "../components/Menus/MenuItem.svelte"
  import { LoadMap } from "../../wailsjs/go/main/Editor"
  import { maps as mapsStore } from '../stores/maps'
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
    </MenuBar>
  </Menus>
</nav>

<style>
  nav {
    background: var(--main-menu);
  }
</style>