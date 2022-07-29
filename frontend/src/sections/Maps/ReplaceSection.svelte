<script lang="ts">
  import type { ReplaceRules } from '../../interfaces/editor'
  import { createEventDispatcher } from 'svelte'
  import { palette } from '../../stores/palette'
  import { MapReplaceAction } from '../../models/maps'

  let replaceRules: ReplaceRules = {
    shouldMatchArchetypes: false,
    shouldMatchName: false,
    shouldMatchType: false,
    matchArchetypes: '',
    matchName: '',
    matchType: '',
    matchMode: 'entire',
    replaceMode: 'replace',
    range: [0,0],
  }

  const dispatch = createEventDispatcher()

  function replace() {
    dispatch('replace')
  }
</script>

<div>
  <fieldset class='match_rules'>
    <legend>Matching</legend>
    <label>
      <span>Entire Selection</span>
      <input type='radio' name='match_select' bind:group={replaceRules.matchMode} value='entire'>
    </label>
    <label>
      <span>Only Top</span>
      <input type='radio' name='match_select' bind:group={replaceRules.matchMode} value='top'>
    </label>
    <label>
      <span>Within Range</span>
      <input type='radio' name='match_select' bind:group={replaceRules.matchMode} value='range'>
    </label>
    <label>
      <span>Range</span>
      <input type='number' bind:value={replaceRules.range[0]} disabled={replaceRules.matchMode!=='range'}/>
      <input type='number' bind:value={replaceRules.range[1]} disabled={replaceRules.matchMode!=='range'}/>
    </label>
    <label>
      <span>Archetypes</span>
      <input type='checkbox' bind:checked={replaceRules.shouldMatchArchetypes}>
      <input disabled={!replaceRules.shouldMatchArchetypes} bind:value={replaceRules.matchArchetypes}>
    </label>
    <label>
      <span>Name</span>
      <input type='checkbox' bind:checked={replaceRules.shouldMatchName}>
      <input disabled={!replaceRules.shouldMatchName} bind:value={replaceRules.matchName}>
    </label>
    <label>
      <span>Type</span>
      <input type='checkbox' bind:checked={replaceRules.shouldMatchType}>
      <input disabled={!replaceRules.shouldMatchType} bind:value={replaceRules.matchType}>
    </label>
  </fieldset>
  <fieldset class='match_rules'>
    <legend>Replacing</legend>
    <label>
      <span>Replace</span>
      <input type='radio' name='match_select' bind:group={replaceRules.replaceMode} value='replace'>
    </label>
    <label>
      <span>Merge</span>
      <input type='radio' name='match_select' bind:group={replaceRules.replaceMode} value='merge'>
    </label>
  </fieldset>
  <button on:click={replace}>
    replace selection
  </button>
</div>

<style>
  .match_rules {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
</style>