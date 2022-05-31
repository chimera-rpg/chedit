<script lang='ts'>
  import Node from './ArchPalette/Node.svelte'
  import { archetypes as archetypesStore } from '../stores/archetypes'
</script>

<main>
  <nav>
    <Node node={$archetypesStore.tree} open={true}></Node>
  </nav>
</main>

<style>
  main {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    background: var(--menu);
    min-width: 10em;
  }
</style>