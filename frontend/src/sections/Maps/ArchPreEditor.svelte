<script lang='ts'>
  import type { ContainerMap } from '../../interfaces/Map'
  import type { Cursor } from '../../interfaces/editor'
  import type { Writable } from 'svelte/store'
  import type { ArchetypeContainer } from '../../interfaces/Archetype'
  import ArchView from '../ArchView.svelte'
  import { cloneObject } from '../../models/archs'

  import applyIcon from '../../assets/icons/apply.png'
  import resetIcon from '../../assets/icons/reset.png'
  import Menus from '../../components/Menus/Menus.svelte'
  import MenuBar from '../../components/Menus/MenuBar.svelte'
  import MenuItem from '../../components/Menus/MenuItem.svelte'

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

  export let arch: ArchetypeContainer

  $: cloned = cloneObject(arch?.Original??{})
  $: changed = JSON.stringify(cloned) !== JSON.stringify(arch?.Original)

  function change(which: string, value: any) {
    cloned[which] = value
    cloned = {...cloned}
  }

  function reset() {
    cloned = cloneObject(arch.Original??{})
  }
  function apply() {
  }
</script>

<div>
  <header>
    {#if arch}
      <span class='archview'>
        <ArchView arch={arch.Compiled}></ArchView>
      </span>
      {arch.Compiled.Name||arch.Compiled.Self}
    {/if}
  </header>
  <section>
    {#if arch}
      <article>
        <label>
          <span>Archs</span>
          <input value={cloned.Archs??''} placeholder={arch.Compiled.Archs} on:change={e=>change('Type', e.target.value)}/>
        </label>

        <label>
          <span>Name</span>
          <input value={cloned.Name??''} placeholder={arch.Compiled.Name} on:change={e=>change('Name', e.target.value)}/>
        </label>
        <label>
          <span>Description</span>
          <textarea value={cloned.Description??''} placeholder={arch.Compiled.Description} on:change={e=>change('Description', e.target.value)}/>
        </label>
        <label>
          <span>Type</span>
          <input value={cloned.Type??''} placeholder={arch.Compiled.Type} on:change={e=>change('Type', e.target.value)}/>
        </label>

        <label>
          <span>Anim</span>
          <input value={cloned.Anim??''} placeholder={arch.Compiled.Anim} on:change={e=>change('Anim', e.target.value)}/>
        </label>
        <label>
          <span>Face</span>
          <input value={cloned.Face??''} placeholder={arch.Compiled.Face} on:change={e=>change('Face', e.target.value)}/>
        </label>

        <label>
          <span>Height</span>
          <input type='number' value={cloned.Height??''} placeholder={arch.Compiled.Height} on:change={e=>change('Height', e.target.value)}/>
        </label>
        <label>
          <span>Width</span>
          <input type='number' value={cloned.Width??''} placeholder={arch.Compiled.Width} on:change={e=>change('Width', e.target.value)}/>
        </label>
        <label>
          <span>Depth</span>
          <input type='number' value={cloned.Depth??''} placeholder={arch.Compiled.Depth} on:change={e=>change('Depth', e.target.value)}/>
        </label>

        <label>
          <span>Matter</span>
          <input value={cloned.Matter??''} placeholder={arch.Compiled.Matter} on:change={e=>change('Matter', e.target.value)}/>
        </label>
        <label>
          <span>Blocking</span>
          <input value={cloned.Blocking??''} placeholder={arch.Compiled.Blocking} on:change={e=>change('Blocking', e.target.value)}/>
        </label>

        <label>
          <span>Audio</span>
          <input value={cloned.Audio??''} placeholder={arch.Compiled.Audio} on:change={e=>change('Audio', e.target.value)}/>
        </label>
        <label>
          <span>SoundSet</span>
          <input value={cloned.SoundSet??''} placeholder={arch.Compiled.SoundSet} on:change={e=>change('SoundSet', e.target.value)}/>
        </label>
        <label>
          <span>SoundIndex</span>
          <input type='number' value={cloned.SoundIndex??''} placeholder={arch.Compiled.SoundIndex} on:change={e=>change('SoundIndex', e.target.value)}/>
        </label>

      </article>
    {/if}
    <div class='toolbar'>
      <Menus>
        <MenuBar>
          <MenuItem disabled={!changed} on:click={reset}>
            <img src={resetIcon} alt='reset'>
          </MenuItem>
          <MenuItem disabled={!changed} on:click={apply}>
            <img src={applyIcon} alt='apply'>
          </MenuItem>
        </MenuBar>
      </Menus>
    </div>
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
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    min-height: 8ch;
  }
  article {
    overflow: auto;
  }
  label {
    display: grid;
    grid-template-columns: 6em minmax(0, 1fr);
  }
  header {
    padding: 0.5em;
    font-weight: bold;
    min-height: 2em;
  }
  .archview {
    float: left;
  }
</style>