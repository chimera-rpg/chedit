<script lang='ts'>
  import type { WandRules, ToolType } from '../../interfaces/editor'

  export let wandRules: WandRules
  export let tool: ToolType
</script>

<div>
  {#if tool==='wand'}
    <fieldset class='wand_settings'>
      <legend>Match Rules</legend>
        <label>
          <span>Archetypes</span>
          <input type='checkbox' bind:checked={wandRules.shouldMatchArchetypes}>
          <input disabled={!wandRules.shouldMatchArchetypes} bind:value={wandRules.matchArchetypes}>
        </label>
        <label>
          <span>Name</span>
          <input type='checkbox' bind:checked={wandRules.shouldMatchName}>
          <input disabled={!wandRules.shouldMatchName} bind:value={wandRules.matchName}>
        </label>
        <label>
          <span>Type</span>
          <input type='checkbox' bind:checked={wandRules.shouldMatchType}>
          <input disabled={!wandRules.shouldMatchType} bind:value={wandRules.matchType}>
        </label>
        <label>
          <span>Y</span>
          <input type='checkbox' bind:checked={wandRules.matchY}>
        </label>
        <label>
          <span>X</span>
          <input type='checkbox' bind:checked={wandRules.matchX}>
        </label>
        <label>
          <span>Z</span>
          <input type='checkbox' bind:checked={wandRules.matchZ}>
        </label>
        <label>
          <span>Diagonal</span>
          <input type='checkbox' bind:checked={wandRules.diagonal}>
        </label>
    </fieldset>
  {/if}
</div>

<style>
</style>