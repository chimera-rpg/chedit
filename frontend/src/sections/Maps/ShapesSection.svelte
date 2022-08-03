<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()
</script>

<div>
  <section>
    <span>Shape</span>
    <button on:click={_=>dispatch('copyShape')}>
      copy
    </button>
    <button on:click={_=>dispatch('pasteShape')}>
      paste
    </button>
  </section>
  <section>
    <span>Selection</span>
    <button on:click={_=>dispatch('copySelection')}>
      copy
    </button>
    <button on:click={_=>dispatch('pasteSelection')}>
      paste
    </button>
  </section>
</div>

<style>
  section {
    display: grid;
    grid-template-columns: 6em auto auto;
  }
</style>