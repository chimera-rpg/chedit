<script lang="ts">
  import type { ReplaceRules } from '../../interfaces/editor'
  import { createEventDispatcher } from 'svelte'
  import { palette } from '../../stores/palette'
  import { MapReplaceAction } from '../../models/maps'

  import { settingsStore } from '../../stores/settings'

  const dispatch = createEventDispatcher()

  function replace() {
    dispatch('replace', $settingsStore.replaceRules)
  }
</script>

<div>
  <fieldset class='match_rules'>
    <legend>Match Rules</legend>
    <label>
      <span>Entire Selection</span>
      <input type='radio' name='match_select' bind:group={$settingsStore.replaceRules.matchMode} value='entire'>
    </label>
    <label>
      <span>Only Top</span>
      <input type='radio' name='match_select' bind:group={$settingsStore.replaceRules.matchMode} value='top'>
    </label>
    <label>
      <span>Within Range</span>
      <input type='radio' name='match_select' bind:group={$settingsStore.replaceRules.matchMode} value='range'>
    </label>
    <label class='range'>
      <span>Range</span>
      <input type='number' bind:value={$settingsStore.replaceRules.range[0]} disabled={$settingsStore.replaceRules.matchMode!=='range'}/>
      <input type='number' bind:value={$settingsStore.replaceRules.range[1]} disabled={$settingsStore.replaceRules.matchMode!=='range'}/>
    </label>
    <label>
      <span>Archetypes</span>
      <input type='checkbox' bind:checked={$settingsStore.replaceRules.shouldMatchArchetypes}>
      <input disabled={!$settingsStore.replaceRules.shouldMatchArchetypes} bind:value={$settingsStore.replaceRules.matchArchetypes}>
    </label>
    <label>
      <span>Name</span>
      <input type='checkbox' bind:checked={$settingsStore.replaceRules.shouldMatchName}>
      <input disabled={!$settingsStore.replaceRules.shouldMatchName} bind:value={$settingsStore.replaceRules.matchName}>
    </label>
    <label>
      <span>Type</span>
      <input type='checkbox' bind:checked={$settingsStore.replaceRules.shouldMatchType}>
      <input disabled={!$settingsStore.replaceRules.shouldMatchType} bind:value={$settingsStore.replaceRules.matchType}>
    </label>
  </fieldset>
  <fieldset class='match_rules'>
    <legend>Replace Mode</legend>
    <label>
      <span>Replace</span>
      <input type='radio' name='replace_select' bind:group={$settingsStore.replaceRules.replaceMode} value='replace'>
    </label>
    <label>
      <span>Merge</span>
      <input type='radio' name='replace_select' bind:group={$settingsStore.replaceRules.replaceMode} value='merge'>
    </label>
  </fieldset>
  <button on:click={replace}>
    replace selection
  </button>
</div>

<style>
  div {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    font-size: 75%;
    background: var(--section);
    color: var(--section-color);
  }
  .match_rules {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  fieldset {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    overflow: auto;
  }
  label {
    display: grid;
    grid-template-columns: 8em auto minmax(0, 1fr);
  }
  label.range {
    grid-template-columns: 8em 4em 4em;
  }
</style>