<script lang="ts">
  import { getContext, createEventDispatcher } from "svelte"

  export let id: any
  let value = -1
  const { index, focusIndex, getFocusedIndex } = getContext('SetIndex')
  value = index()

  const dispatch = createEventDispatcher()
  function handleFocus() {
    focusIndex(value, id)
  }
</script>

<div on:click={handleFocus} class:focused={value===getFocusedIndex()}>
  <slot></slot>
</div>

<style>
  div.focused {
    border: 1px solid red;
  }
</style>