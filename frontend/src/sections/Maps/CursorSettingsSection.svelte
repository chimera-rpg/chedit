<script lang='ts'>
  import { settingsStore } from '../../stores/settings'
</script>

<div>
  <article class='size'>
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
  <fieldset>
    <legend>Hollow</legend>
    <article>
      <label>
        <span>Y</span>
        <input type='checkbox' bind:checked={$settingsStore.cursorRules.hollowY}>
      </label>
      <label>
        <span>X</span>
        <input type='checkbox' bind:checked={$settingsStore.cursorRules.hollowX}>
      </label>
      <label>
        <span>Z</span>
        <input type='checkbox' bind:checked={$settingsStore.cursorRules.hollowZ}>
      </label>
    </article>
    <label>
      <span>Maintain Border</span>
      <input type='checkbox' bind:checked={$settingsStore.cursorRules.hollowBorder}>
    </label>
  </fieldset>
  <fieldset class='cursor_rules__open'>
    <legend>Open</legend>
    <article>
      <label>
        <span>Top</span>
        <input type='checkbox' bind:checked={$settingsStore.cursorRules.openTop}>
      </label>
      <label>
        <span>Bottom</span>
        <input type='checkbox' bind:checked={$settingsStore.cursorRules.openBottom}>
      </label>
    </article>
    <article>
      <label>
        <span>Left</span>
        <input type='checkbox' bind:checked={$settingsStore.cursorRules.openLeft}>
      </label>
      <label>
        <span>Right</span>
        <input type='checkbox' bind:checked={$settingsStore.cursorRules.openRight}>
      </label>
    </article>
    <article>
      <label>
        <span>Back</span>
        <input type='checkbox' bind:checked={$settingsStore.cursorRules.openBack}>
      </label>
      <label>
        <span>Front</span>
        <input type='checkbox' bind:checked={$settingsStore.cursorRules.openFront}>
      </label>
    </article>
  </fieldset>
</div>

<style>
  div {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    font-size: 75%;
    background: var(--section);
    color: var(--section-color);
  }
  article {
    display: flex;
    flex-direction: row;
  }
  article label {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
  }
  article.size {
    display: grid;
    grid-template-columns: auto auto auto;
  }
  article label {
    display: grid;
    grid-template-columns: 1em minmax(0, 1fr);
  }
  .cursor_rules__open article label {
    grid-template-columns: 4em minmax(0, 1fr);
  }
</style>