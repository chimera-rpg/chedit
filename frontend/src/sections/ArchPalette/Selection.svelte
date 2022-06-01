<script lang='ts'>
  import { palette } from '../../stores/palette'
  import { archetypes } from '../../stores/archetypes'
  import ArchView from '../ArchView.svelte'

  $: arch = $archetypes.archetypes[$palette.focused]
</script>

<div>
  {#if arch && arch.Archetype}
    <ArchView anim={arch.Archetype.Anim} face={arch.Archetype.Face}></ArchView>
    <span title={arch.Archetype.Anim+':'+arch.Archetype.Face}>{arch.Archetype.Name}</span>
  {:else}
    <span></span>
    <span>{$palette.focused}</span>
  {/if}
</div>

<style>
  div {
    height: 3em;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    align-items: flex-end;
    padding: .5em;
    box-sizing: content-box;
  }
</style>