<script lang='ts'>
  import type { ContainerMap } from '../../interfaces/Map'
  import type { Cursor } from '../../interfaces/editor'
  import type { Writable } from 'svelte/store'
  import type { ArchetypeContainer } from '../../interfaces/Archetype'
  import ArchView from '../ArchView.svelte'

  export let map: ContainerMap

  export let cursor: Writable<Cursor>

  let fields = [
    'Archs',

    'Name',
    'Description',
    'Type',

    'Anim',
    'Face',

    'Height',
    'Width',
    'Depth',

    'Matter',
    'Blocking',

    'Audio',
    'SoundSet',
    'SoundIndex',

    'Light',

    'Worth', 'Value', 'Count', 'Weight',

    'Exit',
    'Timers',
    'Inventory',
    'SkillTypes',
    'Skills',
    'CompetencyTypes',
    'Competencies',
    'Resistances',
    'AttackTypes',

    'Reach',
    'Attackable',

    'Damage',
    'Armor',
    'Dodge',
    'ChannelTime',
    'RecoveryTime',
    'Level',
    'Advancement',
    'Efficiency',

    'Attributes',

    'Attitudes',
    'Genera',
    'Species',
    'Factions',
    'Legacy',
    'Events',
  ]

  let arch: ArchetypeContainer
  $: arch = map.Tiles?.[$cursor.start.y]?.[$cursor.start.x]?.[$cursor.start.z]?.[$cursor.start.i]

  function change(which: string, value: any) {
    console.log('set', which, value)
  }
</script>

<div>
  <header>
    {#if arch}
      <span class='archview'>
        <ArchView arch={arch.Compiled} zoom={2}></ArchView>
      </span>
      {arch.Compiled.Name||arch.Compiled.Self}
    {/if}
  </header>
  <section>
    {#if arch}
      <article>
        <label>
          <span>Archs</span>
          <input value={arch.Original.Archs??''} placeholder={arch.Compiled.Archs} on:change={e=>change('Type', e.target.value)}/>
        </label>

        <label>
          <span>Name</span>
          <input value={arch.Original.Name??''} placeholder={arch.Compiled.Name} on:change={e=>change('Name', e.target.value)}/>
        </label>
        <label>
          <span>Description</span>
          <textarea value={arch.Original.Description??''} placeholder={arch.Compiled.Description} on:change={e=>change('Description', e.EventTarget.value)}/>
        </label>
        <label>
          <span>Type</span>
          <input value={arch.Original.Type??''} placeholder={arch.Compiled.Type} on:change={e=>change('Type', e.target.value)}/>
        </label>

        <label>
          <span>Anim</span>
          <input value={arch.Original.Anim??''} placeholder={arch.Compiled.Anim} on:change={e=>change('Anim', e.target.value)}/>
        </label>
        <label>
          <span>Face</span>
          <input value={arch.Original.Face??''} placeholder={arch.Compiled.Face} on:change={e=>change('Face', e.target.value)}/>
        </label>

        <label>
          <span>Height</span>
          <input type='number' value={arch.Original.Height??''} placeholder={arch.Compiled.Height} on:change={e=>change('Height', e.target.value)}/>
        </label>
        <label>
          <span>Width</span>
          <input type='number' value={arch.Original.Width??''} placeholder={arch.Compiled.Width} on:change={e=>change('Width', e.target.value)}/>
        </label>
        <label>
          <span>Depth</span>
          <input type='number' value={arch.Original.Depth??''} placeholder={arch.Compiled.Depth} on:change={e=>change('Depth', e.target.value)}/>
        </label>

        <label>
          <span>Matter</span>
          <input value={arch.Original.Matter??''} placeholder={arch.Compiled.Matter} on:change={e=>change('Matter', e.target.value)}/>
        </label>
        <label>
          <span>Blocking</span>
          <input value={arch.Original.Blocking??''} placeholder={arch.Compiled.Blocking} on:change={e=>change('Blocking', e.target.value)}/>
        </label>

        <label>
          <span>Audio</span>
          <input value={arch.Original.Audio??''} placeholder={arch.Compiled.Audio} on:change={e=>change('Audio', e.target.value)}/>
        </label>
        <label>
          <span>SoundSet</span>
          <input value={arch.Original.SoundSet??''} placeholder={arch.Compiled.SoundSet} on:change={e=>change('SoundSet', e.target.value)}/>
        </label>
        <label>
          <span>SoundIndex</span>
          <input type='number' value={arch.Original.SoundIndex??''} placeholder={arch.Compiled.SoundIndex} on:change={e=>change('SoundIndex', e.target.value)}/>
        </label>

      </article>
    {/if}
  </section>
</div>

<style>
  div {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
    font-size: 75%;
    background: var(--section);
    color: var(--section-color);
  }
  section {
    overflow: auto;
    min-height: 8ch;
  }
  article {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  label {
    display: grid;
    grid-template-columns: 6em minmax(0, 1fr);
  }
  header {
    padding: 0.5em;
    font-weight: bold;
  }
  .archview {
    float: left;
  }
</style>