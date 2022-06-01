<script lang='ts'>
  import Menus from "../components/Menus/Menus.svelte"
  import MenuBar from "../components/Menus/MenuBar.svelte"
  import MenuList from "../components/Menus/MenuList.svelte"
  import MenuItem from "../components/Menus/MenuItem.svelte"
  import { LoadMap } from "../../wailsjs/go/main/Editor"
  import { maps as mapsStore } from '../stores/maps'

  async function openMap() {
    let m = await LoadMap()
    mapsStore.open(m)
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