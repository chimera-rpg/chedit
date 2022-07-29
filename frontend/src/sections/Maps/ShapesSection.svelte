<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()
</script>

<div>
  <button on:click={_=>dispatch('copy')}>
    copy shape
  </button>
  <button on:click={_=>dispatch('paste')}>
    paste shape
  </button>
</div>