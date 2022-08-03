<script lang='ts'>
  import type { WandRules, ToolType } from '../../interfaces/editor'
  import { settingsStore } from '../../stores/settings'

  export let tool: ToolType
</script>

<div>
  {#if tool==='wand'}
    <fieldset class='wand_settings'>
      <legend>Match Rules</legend>
        <label>
          <span>Archetypes</span>
          <input type='checkbox' bind:checked={$settingsStore.wandRules.shouldMatchArchetypes}>
          <input disabled={!$settingsStore.wandRules.shouldMatchArchetypes} bind:value={$settingsStore.wandRules.matchArchetypes}>
        </label>
        <label>
          <span>Name</span>
          <input type='checkbox' bind:checked={$settingsStore.wandRules.shouldMatchName}>
          <input disabled={!$settingsStore.wandRules.shouldMatchName} bind:value={$settingsStore.wandRules.matchName}>
        </label>
        <label>
          <span>Type</span>
          <input type='checkbox' bind:checked={$settingsStore.wandRules.shouldMatchType}>
          <input disabled={!$settingsStore.wandRules.shouldMatchType} bind:value={$settingsStore.wandRules.matchType}>
        </label>
        <label>
          <span>Y</span>
          <input type='checkbox' bind:checked={$settingsStore.wandRules.matchY}>
        </label>
        <label>
          <span>X</span>
          <input type='checkbox' bind:checked={$settingsStore.wandRules.matchX}>
        </label>
        <label>
          <span>Z</span>
          <input type='checkbox' bind:checked={$settingsStore.wandRules.matchZ}>
        </label>
        <label>
          <span>Diagonal</span>
          <input type='checkbox' bind:checked={$settingsStore.wandRules.diagonal}>
        </label>
    </fieldset>
  {/if}
</div>

<style>
</style>