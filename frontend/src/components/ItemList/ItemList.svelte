<script lang="ts">
  import { setContext, createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  let startIndex = -1;
  export let focusedIndex = -1;
  setContext('SetIndex', {
    index: (): number => {
      startIndex += 1;
      return startIndex
    },
    focusIndex: (index: number, data: any) => {
      focusedIndex = index
      dispatch('focus', index, data)
    },
    getFocusedIndex: (): number => {
      return focusedIndex
    },
  })
</script>

<div>
  <header>
    <slot name='header'></slot>
  </header>
  <section>
    <slot name='items'></slot>
  </section>
</div>