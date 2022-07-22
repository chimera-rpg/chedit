<script lang='ts'>
  import type { MapsContainer, ContainerMap, ContainerMaps } from '../../interfaces/Map'

  export let map: ContainerMap
</script>

<div>
  <div class='content'>
    <div class='descriptive'>
      <header> Descriptive </header>
      <section>
        <label>
          <span>Name</span>
          <input value={map.Name}/>
        </label>
        <label>
          <span>Description</span>
          <textarea value={map.Description}/>
        </label>
        <label>
          <span>Lore</span>
          <textarea value={map.Lore}/>
        </label>
      </section>
    </div>
    <div class='dimensions'>
      <header> Dimensions </header>
      <section>
        <label>
          <span>Height</span>
          <input type='number' value={map.Height}/>
        </label>
        <label>
          <span>Width</span>
          <input type='number' value={map.Width}/>
        </label>
        <label>
          <span>Depth</span>
          <input type='number' value={map.Depth}/>
        </label>
      </section>
    </div>
    <div class='properties'>
      <header> Properties </header>
      <section>
        <label>
          <span>Data Name</span>
          <input value={map.DataName}/>
        </label>
        <label>
          <span>Default Start Y</span>
          <input type='number' value={map.Y}/>
        </label>
        <label>
          <span>Default Start X</span>
          <input type='number' value={map.X}/>
        </label>
        <label>
          <span>Default Start Z</span>
          <input type='number' value={map.Z}/>
        </label>
        <label>
          <span>Reset Time</span>
          <input type='number' value={map.ResetTime}/>
        </label>
        <label>
          <span>Default Darkness</span>
          <input type='number' value={map.Darkness}/>
        </label>
      </section>
    </div>
  </div>
  <div class='toolbar'>
    toolbar
  </div>
</div>

<style>
  div {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    font-size: 90%;
  }
  .content {
    overflow: auto;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
  }
  .descriptive, .dimensions, .properties {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
  }
  header {
    font-weight: 600;
    text-align: left;
    padding: 0 .5em;
    margin: 0 .5em;
    border-bottom: 1px solid var(--menu-color);
  }
  section {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    justify-content: stretch;
    padding: .5em;
  }
  label {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
  }
  span {
    text-align: left;
    padding: .5em;
  }
  textarea {
    min-height: 8em;
  }
  .descriptive label > span {
    min-width: 8em;
  }
  .dimensions label > span {
    min-width: 8em;
  }
  .properties label > span {
    min-width: 12em;
  }

</style>