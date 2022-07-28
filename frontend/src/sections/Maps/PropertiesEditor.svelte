<script lang='ts'>
  import type { ContainerMap } from '../../interfaces/Map'
  import applyIcon from '../../assets/icons/apply.png'
  import resetIcon from '../../assets/icons/reset.png'
  import Menus from '../../components/Menus/Menus.svelte'
  import MenuBar from '../../components/Menus/MenuBar.svelte'
  import MenuItem from '../../components/Menus/MenuItem.svelte'
  import { MapChangeFieldAction, MapFields, MapResizeAction } from '../../models/maps'
  import { maps as mapsStore, MapsStoreData } from '../../stores/maps'
  import { onMount } from 'svelte'

  export let map: ContainerMap

  let growLeft=0, growRight=0, growBottom=0, growTop=0, growUp=0, growDown=0

  let changes = Object.keys(map).filter(k => MapFields.includes(k)).reduce((cur, key) => { return Object.assign(cur, { [key]: map[key] })}, {})
  $: changeCount = Object.keys(changes).map(k=>changes[k]===map[k]).filter(v=>v!==true)
  $: changed = changeCount.length>0 || growLeft!=0 || growRight!=0 || growBottom!=0 || growTop!=0 || growUp!=0 || growDown!=0

  function change(key: string, v: any) {
    if (['Depth','Width','Height','Darkness','ResetTime','Y','X','Z'].includes(key)) {
      v = Number(v)
    }
    changes[key] = v
  }

  function reset() {
    changes = Object.keys(map).filter(k => MapFields.includes(k)).reduce((cur, key) => { return Object.assign(cur, { [key]: map[key] })}, {})
    growLeft = growRight = growBottom = growTop = growUp = growDown = 0
  }
  function apply() {
    map.queue()

    // Update fields.
    for (let k of Object.keys(changes).filter(k=>changes[k]!==map[k])) {
      console.log('gonna dodo', k, changes[k])
      map.apply(new MapChangeFieldAction({
        key: k,
        value: changes[k],
      }))
    }

    // Grow/shrink.
    if (growLeft!=0 || growRight!=0 || growBottom!=0 || growTop!=0 || growUp!=0 || growDown!=0) {
      map.apply(new MapResizeAction({
        left: growLeft,
        right: growRight,
        bottom: growBottom,
        top: growTop,
        up: growUp,
        down: growDown,
      }))
    }

    map.unqueue()
    // Reset the map store to update all map listeners.
    mapsStore.set($mapsStore)
  }

  onMount(() => {
    let unsub = mapsStore.subscribe((v: MapsStoreData) => {
      // This is lazy, but we find the matching map store map for our map and then refresh our UI accordingly.
      for (let m of v.maps) {
        for (let [k, map2] of Object.entries(m.Maps)) {
          if (map === map2) {
            changes = Object.keys(map).filter(k => MapFields.includes(k)).reduce((cur, key) => { return Object.assign(cur, { [key]: map[key] })}, {})
            return
          }
        }
      }
    })
    return () => {
      unsub()
    }
  })
</script>

<div>
  <div class='content'>
    <div class='descriptive'>
      <header> Descriptive </header>
      <section>
        <label>
          <span>Name</span>
          <input value={changes['Name']} on:change={e=>change('Name', e.target.value)}/>
        </label>
        <label>
          <span>Description</span>
          <textarea value={changes['Description']} on:change={e=>change('Description', e.target.value)}/>
        </label>
        <label>
          <span>Lore</span>
          <textarea value={changes['Lore']} on:change={e=>change('Lore', e.target.value)}/>
        </label>
      </section>
    </div>
    <div class='dimensions'>
      <header> Dimensions </header>
      <article>
        <section>
          <label class='small-number'>
            <span>Height</span>
            <input type='number' disabled value={changes['Height']} on:change={e=>change('Height', e.target.value)}/>
          </label>
          <label class='small-number'>
            <span>Width</span>
            <input type='number' disabled value={changes['Width']} on:change={e=>change('Width', e.target.value)}/>
          </label>
          <label class='small-number'>
            <span>Depth</span>
            <input type='number' disabled value={changes['Depth']} on:change={e=>change('Depth', e.target.value)}/>
          </label>
        </section>
        <section>
          <article>
            <label class='small-number'>
              <span>Left</span>
              <input type='number' bind:value={growLeft} placeholder=0/>
            </label>
            <label class='small-number'>
              <span>Right</span>
              <input type='number' bind:value={growRight} placeholder=0/>
            </label>
          </article>
          <article>
            <label class='small-number'>
              <span>Top</span>
              <input type='number' bind:value={growTop} placeholder=0/>
            </label>
            <label class='small-number'>
              <span>Bottom</span>
              <input type='number' bind:value={growBottom} placeholder=0/>
            </label>
          </article>
          <article>
            <label class='small-number'>
              <span>Up</span>
              <input type='number' bind:value={growUp} placeholder=0/>
            </label>
            <label class='small-number'>
              <span>Down</span>
              <input type='number' bind:value={growDown} placeholder=0/>
            </label>
          </article>
        </section>
      </article>
    </div>
    <div class='properties'>
      <header> Properties </header>
      <section>
        <article>
          <span>Default Start</span>
          <label class='small-number'>
            <span>Y</span>
            <input type='number' value={changes['Y']} on:change={e=>change('Y', e.target.value)}/>
          </label>
          <label class='small-number'>
            <span>X</span>
            <input type='number' value={changes['X']} on:change={e=>change('X', e.target.value)}/>
          </label>
          <label class='small-number'>
            <span>Z</span>
            <input type='number' value={changes['Z']} on:change={e=>change('Z', e.target.value)}/>
          </label>
        </article>
        <label>
          <span>Reset Time</span>
          <input type='number' value={changes['ResetTime']} on:change={e=>change('ResetTime', e.target.value)}/>
        </label>
        <label>
          <span>Haven</span>
          <input type='checkbox' checked={changes['Haven']} on:change={e=>change('Haven', e.target.checked)}/>
        </label>
        <label>
          <span>Default Darkness</span>
          <input type='number' value={changes['Darkness']} on:change={e=>change('Darkness', e.target.value)}/>
        </label>
      </section>
    </div>
  </div>
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
  article {
    display: flex;
    justify-content: stretch;
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
 .descriptive span {
    min-width: 8em;
  }
  .dimensions span {
    min-width: 5em;
  }
  .properties span {
    min-width: 12em;
  }
  label.small-number > span {
    min-width: 5em;
    text-align: right;
  }
  label.small-number > input {
    width: 4em;
  }
</style>