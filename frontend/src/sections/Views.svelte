<script lang='ts'>
  import List from "./Maps/List.svelte"
  import Windows from "./Maps/Windows.svelte"
  import Menus from '../components/Menus/Menus.svelte'
  import MenuBar from '../components/Menus/MenuBar.svelte'
  import MenuItem from '../components/Menus/MenuItem.svelte'
  import MenuList from '../components/Menus/MenuList.svelte'
  import { settingsStore } from '../stores/settings'
</script>

<div>
  <Menus>
    <MenuBar>
      <MenuItem popup='view-menu'>
        View
        <MenuList popup='view-menu'>
          <MenuItem on:click={_=>$settingsStore.showHeightNumbers=!$settingsStore.showHeightNumbers} noclose>
            Show Height Numbers
            <input type='checkbox' bind:checked={$settingsStore.showHeightNumbers}>
          </MenuItem>
          <MenuItem on:click={_=>$settingsStore.showHeightNumbersOnAlt=!$settingsStore.showHeightNumbersOnAlt} noclose>
            Show Height Numbers On Alt
            <input type='checkbox' bind:checked={$settingsStore.showHeightNumbersOnAlt}>
          </MenuItem>
          <MenuItem on:click={_=>$settingsStore.showHeightNumbersSameYOnly=!$settingsStore.showHeightNumbersSameYOnly} noclose>
            Show Height On Hover Y Only
            <input type='checkbox' bind:checked={$settingsStore.showHeightNumbersSameYOnly}>
          </MenuItem>
          <MenuItem on:click={_=>$settingsStore.showPlacementHeightNumber=!$settingsStore.showPlacementHeightNumber} noclose>
            Show Cursor/Hover Placement Height Numbers
            <input type='checkbox' bind:checked={$settingsStore.showPlacementHeightNumber}>
          </MenuItem>
          <MenuItem on:click={_=>$settingsStore.showPlacementLines=!$settingsStore.showPlacementLines} noclose>
            Show Cursor/Hover Placement Lines
            <input type='checkbox' bind:checked={$settingsStore.showPlacementLines}>
          </MenuItem>
        </MenuList>
      </MenuItem>
    </MenuBar>
  </Menus>
  <List></List>
  <Windows></Windows>
</div>

<style>
  div {
    position: relative;
    background: var(--content);
    overflow: hidden;
  }
</style>