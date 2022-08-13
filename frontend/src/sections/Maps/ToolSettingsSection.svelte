<script lang='ts'>
  import type { WandRules, ToolType } from '../../interfaces/editor'
  import { settingsStore } from '../../stores/settings'

  export let tool: ToolType
</script>

<div>
  {#if tool==='insert'||tool==='erase'}
    <fieldset class='cursor_rules'>
      <legend>Cursor</legend>
      <article>
        <label>
          <span>H</span>
          <input type='number' bind:value={$settingsStore.cursorRules.height}>
        </label>
        <label>
          <span>W</span>
          <input type='number' bind:value={$settingsStore.cursorRules.width}>
        </label>
        <label>
          <span>D</span>
          <input type='number' bind:value={$settingsStore.cursorRules.depth}>
        </label>
      </article>
    </fieldset>
  {/if}
  {#if tool==='insert'||tool==='fill'}
    <label>
      <span>Attempt Replace</span>
      <input type='checkbox' bind:checked={$settingsStore.insertRules.checkForReplace}>
    </label>
    <label>
      <span>Archetypes</span>
      <input type='checkbox' bind:checked={$settingsStore.insertRules.shouldMatchArchetypes}>
      <input disabled={!$settingsStore.insertRules.shouldMatchArchetypes} bind:value={$settingsStore.insertRules.matchArchetypes}>
    </label>
    <label>
      <span>Name</span>
      <input type='checkbox' bind:checked={$settingsStore.insertRules.shouldMatchName}>
      <input disabled={!$settingsStore.insertRules.shouldMatchName} bind:value={$settingsStore.insertRules.matchName}>
    </label>
    <label>
      <span>Type</span>
      <input type='checkbox' bind:checked={$settingsStore.insertRules.shouldMatchType}>
      <input disabled={!$settingsStore.insertRules.shouldMatchType} bind:value={$settingsStore.insertRules.matchType}>
    </label>
    <label>
      <span>Insert on no Match</span>
      <input type='checkbox' bind:checked={$settingsStore.insertRules.insertOnNoMatch}>
    </label>
    <fieldset class='match_rules'>
      <legend>Replace Mode</legend>
      <label>
        <span>Replace</span>
        <input type='radio' name='insert_replace_select' bind:group={$settingsStore.insertRules.replaceMode} value='replace'>
      </label>
      <label>
        <span>Merge</span>
        <input type='radio' name='insert_replace_select' bind:group={$settingsStore.insertRules.replaceMode} value='merge'>
      </label>
    </fieldset>
  {:else if tool==='wand'}
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
    <article>
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
    </article>
  {:else if tool==='placing'}
    <label>
      <span>Deduplicate</span>
        <input type='checkbox' bind:checked={$settingsStore.placeRules.deduplicate}>
    </label>
    <label>
      <span>Clear destinations</span>
        <input type='checkbox' bind:checked={$settingsStore.placeRules.clear}>
    </label>
  {/if}
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
  label {
    display: grid;
    grid-template-columns: 8em auto minmax(0, 1fr);
  }
  article {
    display: flex;
    flex-direction: row;
  }
  article label {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
  }
  .cursor_rules label {
    display: grid;
    grid-template-columns: 1em minmax(0, 1fr);
  }
  .cursor_rules article {
    display: grid;
    grid-template-columns: auto auto auto;
  }
</style>