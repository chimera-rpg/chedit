<script lang='ts'>
  import Node from './ArchPalette/Node.svelte'
  import Selection from './ArchPalette/Selection.svelte'
  import { archetypes as archetypesStore } from '../stores/archetypes'
</script>

<div>
  <header>Archetypes</header>
  <nav>
    <Node node={$archetypesStore.tree} open={true}></Node>
  </nav>
  <Selection></Selection>
</div>

<style>
  div {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    background: var(--section);
    color: var(--section-color);
    min-width: 10em;
    overflow: hidden;
    user-select: none;
  }
  header {
    font-weight: bold;
    background: var(--section-header);
  }
  nav {
    overflow: auto;
    font-size: 75%;
  }
</style>