<script lang='ts'>
  import { createEventDispatcher, getContext } from 'svelte'
  import { POPUPS } from './Menus.svelte'

  const dispatch = createEventDispatcher()

  const { openPopup, closePopup, openSubPopup } = getContext(POPUPS)

  export let popup = ''
  export let subpopup = ''
  export let disabled = false
  export let noclose = false
  export let highlighted = false
  export let title = ''
  let self: Element

  function click(e: MouseEvent) {
    if (!self.contains(e.target) && e.target !== self) return

    let rect = self.getBoundingClientRect()
    if (popup) {
      openPopup(popup, rect.x, rect.y + rect.height)
    } else if (subpopup) {
      openSubPopup(subpopup, rect.x + rect.width, rect.y)
    } else {
      dispatch('click', e)
      if (noclose) return
      closePopup()
    }
  }
</script>

<button class:disabled={disabled} class:highlighted bind:this={self} on:click={click} title={title}>
  <slot></slot>
</button>

<style>
  button {
    position: relative;
    margin: 0;
    border: 0;
    background: none;
    text-align: left;
    min-height: 2em;
    background: var(--menu);
    color: var(--menu-color);
  }
  button.disabled {
    pointer-events: none;
    opacity: 0.5;
  }
  button.highlighted {
    background: var(--selected);
  }
</style>