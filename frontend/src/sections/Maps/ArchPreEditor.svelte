<script lang='ts'>
  import type { ContainerMap } from '../../interfaces/Map'
  import { ArchetypeTypes, MatterTypes, type Cursor } from '../../interfaces/editor'
  import type { Writable } from 'svelte/store'
  import type { Archetype, ArchetypeContainer } from '../../interfaces/Archetype'
  import ArchView from '../ArchView.svelte'
  import { cloneObject } from '../../models/archs'

  import applyIcon from '../../assets/icons/apply.png'
  import resetIcon from '../../assets/icons/reset.png'
  import Menus from '../../components/Menus/Menus.svelte'
  import MenuBar from '../../components/Menus/MenuBar.svelte'
  import MenuItem from '../../components/Menus/MenuItem.svelte'
  import ItemList from '../../components/ItemList/ItemList.svelte'
  import ItemListItem from '../../components/ItemList/ItemListItem.svelte'

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

  let showCompiled: boolean = false

  $: cloned = cloneObject(arch?.Original??{})
  $: changed = JSON.stringify(cloned) !== JSON.stringify(arch?.Original)

  let clonedCopy: Archetype = cloned

  function change(which: string, value: any) {
    if (showCompiled) return
    cloned[which] = value
    cloned = {...cloned}
  }

  function reset() {
    cloned = cloneObject(arch.Original??{})
  }
  function apply() {
    if (showCompiled) return
  }

  function addArch() {
    if (showCompiled) return
    cloned.Archs = [...cloned.Archs, '']
    cloned = {...cloned}
  }
  function removeArch(index: number) {
    if (showCompiled) return
    cloned.Archs.splice(index, 1)
    cloned = {...cloned}
  }
  function addMatter() {
    if (showCompiled) return
    if (!cloned.Matter) cloned.Matter = []
    cloned.Matter = [...cloned.Matter, '']
    cloned = {...cloned}
  }
  function removeMatter(index: number) {
    if (showCompiled) return
    cloned.Matter.splice(index, 1)
    if (cloned.Matter.length === 0) delete cloned.Matter
    cloned = {...cloned}
  }
  function addBlocking() {
    if (showCompiled) return
    if (!cloned.Blocking) cloned.Blocking = []
    cloned.Blocking = [...cloned.Blocking, '']
    cloned = {...cloned}
  }
  function removeBlocking(index: number) {
    if (showCompiled) return
    cloned.Blocking.splice(index, 1)
    if (cloned.Blocking.length === 0) delete cloned.Blocking
    cloned = {...cloned}
  }
  function toggleCompiled() {
    showCompiled = !showCompiled
    if (showCompiled) {
      clonedCopy = cloned
      cloned = cloneObject(arch?.Compiled??{})
    } else {
      cloned = clonedCopy
    }
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
    <button on:click={toggleCompiled}>
      {#if !showCompiled}
        compiled
      {:else}
        source
      {/if}
    </button>
  </header>
  <section>
    {#if arch}
      <article>
        <div class='entry__archs'>
          <span>Archs</span>
          <ItemList>
            <svelte:fragment slot='header'>
              <button on:click={addArch}> + </button>
            </svelte:fragment>
            <svelte:fragment slot='items'>
              {#each cloned.Archs as a, index}
                <ItemListItem id={index}>
                  <input placeholder={a} on:change={e=>change('Archs.'+index, e.currentTarget.value)}>
                  <button on:click={_=>removeArch(index)}>x</button>
                </ItemListItem>
              {/each}
            </svelte:fragment>
          </ItemList>
        </div>
        <label>
          <span>Name</span>
          <input value={cloned.Name??''} placeholder={arch.Compiled.Name} on:change={e=>change('Name', e.currentTarget.value)}/>
        </label>
        <label>
          <span>Description</span>
          <textarea value={cloned.Description??''} placeholder={arch.Compiled.Description} on:change={e=>change('Description', e.currentTarget.value)}/>
        </label>
        <label>
          <span>Type</span>
          <select name="Type" value={cloned.Type??arch.Compiled.Type} on:change={e=>change('Type', e.currentTarget.value)}>
            <option value="">Unknown</option>
            {#each Object.entries(ArchetypeTypes) as [k, g]}
              <optgroup label={k}>
              {#each g as t}
                <option value={t}>{t}</option>
              {/each}
              </optgroup>
            {/each}
          </select>
        </label>

        {#if (cloned.Type??arch.Compiled.Type) == 'Exit'}
          <fieldset>
            <legend>Exit</legend>
            <label>
              <span>Name</span>
              <input value={cloned.Exit?.Name??''} placeholder={arch.Compiled.Exit?.Name} on:change={e=>change('Exit.Name', e.currentTarget.value)}/>
            </label>
            <label>
              <span>Y</span>
              <input type='number' value={cloned.Exit?.Y??''} placeholder={arch.Compiled.Exit?.Y} on:change={e=>change('Exit.Y', e.currentTarget.value)}/>
            </label>
            <label>
              <span>X</span>
              <input type='number' value={cloned.Exit?.X??''} placeholder={arch.Compiled.Exit?.X} on:change={e=>change('Exit.X', e.currentTarget.value)}/>
            </label>
            <label>
              <span>Z</span>
              <input type='number' value={cloned.Exit?.Z??''} placeholder={arch.Compiled.Exit?.Z} on:change={e=>change('Exit.Z', e.currentTarget.value)}/>
            </label>
            <label>
              <span>Touch</span>
              <input type='checkbox' checked={cloned.Exit?.Touch??''} placeholder={arch.Compiled.Exit?.Touch} on:change={e=>change('Exit.Touch', e.currentTarget.checked)}/>
            </label>
            <label>
              <span>Cooldown</span>
              <input value={cloned.Exit?.Cooldown??''} placeholder={arch.Compiled.Exit?.Cooldown} on:change={e=>change('Exit.Cooldown', e.currentTarget.value)}/>
            </label>
            <label>
              <span>Size Ratio</span>
              <input type='number' value={cloned.Exit?.SizeRatio??''} placeholder={arch.Compiled.Exit?.SizeRatio} on:change={e=>change('Exit.SizeRatio', e.currentTarget.value)}/>
            </label>
            <label>
              <span>Uses</span>
              <input type='number' value={cloned.Exit?.Uses??''} placeholder={arch.Compiled.Exit?.Uses} on:change={e=>change('Exit.Uses', e.currentTarget.value)}/>
            </label>
            <label>
              <span>Unique Uses</span>
              <input type='number' value={cloned.Exit?.UniqueUses??''} placeholder={arch.Compiled.Exit?.UniqueUses} on:change={e=>change('Exit.UniqueUses', e.currentTarget.value)}/>
            </label>
          </fieldset>
        {/if}

        {#if (cloned.Type??arch.Compiled.Type) == 'Audio'}
          <fieldset>
            <legend>Audio</legend>
            <label>
              <span>Audio</span>
              <input value={cloned.Audio??''} placeholder={arch.Compiled.Audio} on:change={e=>change('Audio', e.currentTarget.value)}/>
            </label>
            <label>
              <span>SoundSet</span>
              <input value={cloned.SoundSet??''} placeholder={arch.Compiled.SoundSet} on:change={e=>change('SoundSet', e.currentTarget.value)}/>
            </label>
            <label>
              <span>SoundIndex</span>
              <input type='number' value={cloned.SoundIndex??''} placeholder={arch.Compiled.SoundIndex} on:change={e=>change('SoundIndex', e.currentTarget.value)}/>
            </label>
          </fieldset>
        {/if}

        {#if (cloned.Type??arch.Compiled.Type) == 'Special'}
          <fieldset>
            <legend>Specials</legend>
            <label>
              <span>Haven</span>
              <input type='checkbox' checked={cloned.Haven??arch.Compiled.Specials?.Haven} on:change={e=>change('Specials.Haven', e.currentTarget.checked)}/>
            </label>
          </fieldset>
        {/if}
        <fieldset>
          <legend>Appearance</legend>
          <label>
            <span>Anim</span>
            <input value={cloned.Anim??''} placeholder={arch.Compiled.Anim} on:change={e=>change('Anim', e.currentTarget.value)}/>
          </label>
          <label>
            <span>Face</span>
            <input value={cloned.Face??''} placeholder={arch.Compiled.Face} on:change={e=>change('Face', e.currentTarget.value)}/>
          </label>
        </fieldset>

        <fieldset>
          <legend>Dimensionality</legend>
          <label>
            <span>Height</span>
            <input type='number' value={cloned.Height??''} placeholder={arch.Compiled.Height} on:change={e=>change('Height', e.currentTarget.value)}/>
          </label>
          <label>
            <span>Width</span>
            <input type='number' value={cloned.Width??''} placeholder={arch.Compiled.Width} on:change={e=>change('Width', e.currentTarget.value)}/>
          </label>
          <label>
            <span>Depth</span>
            <input type='number' value={cloned.Depth??''} placeholder={arch.Compiled.Depth} on:change={e=>change('Depth', e.currentTarget.value)}/>
          </label>

          <div class='entry__matter'>
            <span>Matter</span>
            <ItemList>
              <svelte:fragment slot='header'>
                <button on:click={addMatter}> + </button>
              </svelte:fragment>
              <svelte:fragment slot='items'>
                {#if cloned.Matter}
                  {#each cloned.Matter as m, index}
                    <ItemListItem id={index}>
                      <select name="Matter" value={m} on:change={e=>change('Matter.'+index, e.currentTarget.value)}>
                        <option value="">Undefined</option>
                        {#each MatterTypes as t}
                          <option value={t}>{t}</option>
                        {/each}
                      </select>
                      <button on:click={_=>removeMatter(index)}>x</button>
                    </ItemListItem>
                  {/each}
                {/if}
              </svelte:fragment>
            </ItemList>
          </div>

          <div class='entry__blocking'>
            <span>Blocking</span>
            <ItemList>
              <svelte:fragment slot='header'>
                <button on:click={addBlocking}> + </button>
              </svelte:fragment>
              <svelte:fragment slot='items'>
                {#if cloned.Blocking}
                  {#each cloned.Blocking as b, index}
                    <ItemListItem id={index}>
                      <select name="Blocking" value={b} on:change={e=>change('Blocking.'+index, e.currentTarget.value)}>
                        <option value="">Undefined</option>
                        {#each MatterTypes as t}
                          <option value={t}>{t}</option>
                        {/each}
                      </select>
                      <button on:click={_=>removeBlocking(index)}>x</button>
                    </ItemListItem>
                  {/each}
                {/if}
              </svelte:fragment>
            </ItemList>
          </div>

        </fieldset>

        <fieldset>
          <legend>Events</legend>
          {#if (cloned.Type??arch.Compiled.Type) == 'Exit'}
            <details>
              <summary>Exit</summary>
              <label>
                <span>Trigger</span>
                <input value={cloned.Events?.Exit?.Trigger?.Event??''} placeholder={arch.Compiled.Events?.Exit?.Trigger?.Event} on:change={e=>change('Events.Exit.Trigger.Event', e.currentTarget.value)}/>
              </label>
              <!-- TODO: Spawn -->
              <!-- TODO: Replace -->
              <textarea class='script' value={cloned.Events?.Exit?.Script??''} placeholder={arch.Compiled.Events?.Exit?.Script}></textarea>
            </details>
          {/if}
        </fieldset>
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
  textarea.script {
    font-family: monospace;
  }
  .entry__archs, .entry__matter, .entry__blocking {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }
</style>