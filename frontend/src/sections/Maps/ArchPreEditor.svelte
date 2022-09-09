<script lang='ts'>
  import type { ContainerMap } from '../../interfaces/Map'
  import { ArchetypeTypes, MatterTypes, type Cursor } from '../../interfaces/editor'
  import { createEventDispatcher } from 'svelte'
  import type { Writable } from 'svelte/store'
  import type { Archetype, ArchetypeContainer } from '../../interfaces/Archetype'
  import ArchView from '../ArchView.svelte'
  import { cloneObject } from '../../models/archs'
  import DotDotty from 'dot-dotty'
  import Field from './ArchEditor/Field.svelte'

  import applyIcon from '../../assets/icons/apply.png'
  import resetIcon from '../../assets/icons/reset.png'
  import Menus from '../../components/Menus/Menus.svelte'
  import MenuBar from '../../components/Menus/MenuBar.svelte'
  import MenuItem from '../../components/Menus/MenuItem.svelte'
  import ItemList from '../../components/ItemList/ItemList.svelte'
  import ItemListItem from '../../components/ItemList/ItemListItem.svelte'

  const dispatch = createEventDispatcher()

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

  let cloned: Archetype
  $: cloned = cloneObject(arch?.Original??{})
  $: changed = JSON.stringify(cloned) !== JSON.stringify(arch?.Original)
  $: clonedDD = DotDotty(cloned, {throwErrors: false, throwTraps: false})
  $: compiledDD = DotDotty(arch?.Compiled??{}, {throwErrors: false, throwTraps: false})

  let clonedCopy: Archetype = cloned
  let disabled: boolean = false

  function change(which: string, value: any) {
    if (showCompiled) return
    clonedDD[which] = value
    cloned = {...cloned}
  }
  function clear(which: string) {
    if (showCompiled) return
    delete cloned[which]
    cloned = {...cloned}
  }
  function update() {
    cloned = {...cloned}
  }

  function reset() {
    cloned = cloneObject(arch.Original??{})
  }
  function apply() {
    dispatch('apply', cloned)
  }

  function addArch() {
    if (showCompiled) return
    if (!cloned.Archs) cloned.Archs = []
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
  function toggleLight(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    if (!e.currentTarget.checked) {
      delete cloned.Light
    } else {
      cloned.Light = {
        Red: 255,
        Green: 255,
        Blue: 255,
        Distance: 8,
        Falloff: 1,
      }
    }
    cloned = {...cloned}
  }
  function toggleEvents(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    if (!e.currentTarget.checked) {
      delete cloned.Events
    } else {
      cloned.Events = {
      }
    }
    cloned = {...cloned}
  }
  function toggleCompiled() {
    showCompiled = !showCompiled
    disabled = showCompiled
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
      {#if showCompiled}
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
              <button disabled={disabled} on:click={e=>clear('Archs')}>c</button>
            </svelte:fragment>
            <svelte:fragment slot='items'>
              {#if cloned.Archs}
                {#each cloned.Archs as a, index}
                  <ItemListItem id={index}>
                    <input disabled={disabled} placeholder={a} on:change={e=>change('Archs.'+index, e.currentTarget.value)}>
                    <button disabled={disabled} on:click={_=>removeArch(index)}>x</button>
                  </ItemListItem>
                {/each}
              {/if}
            </svelte:fragment>
          </ItemList>
        </div>
        <Field key='Name' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
        <Field key='Description' type='textarea' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
        <Field key='Type' type='list' list={ArchetypeTypes} {disabled} {clonedDD} {compiledDD} on:update={update}></Field>

        {#if (cloned.Type??arch.Compiled.Type) == 'Exit'}
          <fieldset>
            <legend>Exit</legend>
            <Field key='Exit.Name' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='Exit.Y' type='number' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='Exit.X' type='number' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='Exit.Z' type='number' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='Exit.Touch' type='checkbox' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='Exit.Cooldown' type='number' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='Exit.SizeRatio' type='number' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='Exit.Uses' type='number' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='Exit.UniqueUses' type='number' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
          </fieldset>
        {/if}

        {#if (cloned.Type??arch.Compiled.Type) == 'Audio'}
          <fieldset>
            <legend>Audio</legend>
            <Field key='Audio' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='SoundSet' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='SoundIndex' type='number' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
          </fieldset>
        {/if}

        {#if (cloned.Type??arch.Compiled.Type) == 'Special'}
          <fieldset>
            <legend>Specials</legend>
            <Field key='Specials.Haven' type='checkbox' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
          </fieldset>
        {/if}
        <fieldset>
          <legend>Appearance</legend>
          <Field key='Anim' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
          <Field key='Face' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
        </fieldset>

        <fieldset>
          <legend>Dimensionality</legend>
          <Field key='Height' type='number' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
          <Field key='Width' type='number' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
          <Field key='Depth' type='number' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>

          <div class='entry__matter'>
            <span>Matter</span>
            <ItemList>
              <svelte:fragment slot='header'>
                <button disabled={disabled} on:click={addMatter}> + </button>
                <button disabled={disabled} on:click={e=>clear('Matter')}>c</button>
              </svelte:fragment>
              <svelte:fragment slot='items'>
                {#if cloned.Matter}
                  {#each cloned.Matter as m, index}
                    <ItemListItem id={index}>
                      <select disabled={disabled} name="Matter" value={m} on:change={e=>change('Matter.'+index, e.currentTarget.value)}>
                        <option value="">Undefined</option>
                        {#each MatterTypes as t}
                          <option value={t}>{t}</option>
                        {/each}
                      </select>
                      <button disabled={disabled} on:click={_=>removeMatter(index)}>x</button>
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
                <button disabled={disabled} on:click={addBlocking}> + </button>
                <button disabled={disabled} on:click={e=>clear('Blocking')}>c</button>
              </svelte:fragment>
              <svelte:fragment slot='items'>
                {#if cloned.Blocking}
                  {#each cloned.Blocking as b, index}
                    <ItemListItem id={index}>
                      <select disabled={disabled} name="Blocking" value={b} on:change={e=>change('Blocking.'+index, e.currentTarget.value)}>
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
          <legend>
            <label>
              <span>Light</span>
              <input type='checkbox' on:change={toggleLight} checked={cloned.Light!==undefined}>
            </label>
          </legend>
          {#if cloned.Light}
            <Field key='Light.Red' type='number' step=1 min=0 max=255 {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='Light.Green' type='number' step=1 min=0 max=255 {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='Light.Blue' type='number' step=1 min=0 max=255 {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='Light.Distance' type='number' step=1 min=1 max=100  {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            <Field key='Light.Falloff' type='number' step=0.1 min=0 max=10 {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
          {/if}
        </fieldset>

        <fieldset>
          <legend>
            <label>
              <span>Events</span>
              <input type='checkbox' on:change={toggleEvents} checked={cloned.Events!==undefined}>
            </label>
          </legend>
          {#if cloned.Events !== undefined}
            <fieldset>
              <legend>
                <span>Birth</span>
                <input type='checkbox' on:change={toggleEvents} checked={cloned.Events.Birth!==undefined}>
              </legend>
              {#if cloned.Events.Birth !== undefined}
                TODO
              {/if}
            </fieldset>
          {/if}
          {#if (cloned.Type??arch.Compiled.Type) == 'Exit'}
            <details>
              <summary>Exit</summary>
              <Field label='Trigger Event' key='Events.Exit.Trigger.Event' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
              <!-- TODO: Spawn -->
              <!-- TODO: Replace -->
              <Field key='Events.Exit.Script' type='textarea' {disabled} {clonedDD} {compiledDD} on:update={update}></Field>
            </details>
          {/if}
        </fieldset>
      </article>
    {/if}
    <div class='toolbar'>
      <Menus>
        <MenuBar>
          <MenuItem disabled={disabled||!changed} on:click={reset}>
            <img src={resetIcon} alt='reset'>
          </MenuItem>
          <MenuItem disabled={disabled||!changed} on:click={apply}>
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
    grid-template-columns: 6em minmax(0, 1fr) auto;
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