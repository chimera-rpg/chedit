<script lang='ts'>
  import { getContext } from 'svelte'
  import { POPUPS } from './Menus.svelte'
  import { clickOutside } from './clicker'
  import { fade } from 'svelte/transition'

  export let popup: string = ''
  export let subpopup: string = ''
  const { currentPopup, openPopup, currentSubPopup, openSubPopup } = getContext(POPUPS)
</script>

{#if popup && $currentPopup.name === popup}
  <nav transition:fade="{{duration:100}}" style="left: {$currentPopup.x}px; top: {$currentPopup.y}px;" use:clickOutside on:outclick={()=>openPopup('', 0, 0)}>
    <slot></slot>
  </nav>
{:else if subpopup && $currentSubPopup.name === subpopup}
  <nav transition:fade="{{duration:100}}" style="left: {$currentSubPopup.x}px; top: {$currentSubPopup.y}px;" use:clickOutside on:outclick={()=>openSubPopup('', 0, 0)}>
    <slot></slot>
  </nav>
{/if}

<style>
  nav {
    position: fixed;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    z-index: 1000;
  }
</style>