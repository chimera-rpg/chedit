<script lang="ts">
  import { compileInJS, cloneObject } from '../../models/archs'

  import type { data } from '../../../wailsjs/go/models'
  import ArchView from '../ArchView.svelte'

  export let map: data.Map
  export let y = 0
  export let x = 0
  export let z = 0

  interface ArchetypeWrapper {
    original: data.Archetype
    compiled: data.Archetype
  }

  let tiles: ArchetypeWrapper[][] = []

  $: onChange(map, y, x, z)
  function onChange(...args: any) {
    let ctiles = []
    // Get the entire Y stack.
    for (let i = 0; i < map.Height; i++) {
      let p = map.Tiles[i]
      if (!p) return
      p = p[x]
      if (!p) return
      p = p[z]
      if (!p) return
      ctiles.push(p)
    }
    // Kind of excessive to recompile each change, but whatever.
    tiles = []
    for (let archs of ctiles) {
      let s = []
      for (let arch of archs) {
        s.push({
          original: arch,
          compiled: compileInJS(cloneObject(arch)),
        })
      }
      console.log(s)
      tiles.push(s)
    }
  }
</script>

<div>
  <header>
    Tiles
  </header>
  <ol class='tiles'>
    {#each tiles as tile, tileY}
      <li class='tile' class:selected={y===tileY}>
        <span>{tileY}</span>
        <ol class='archs'>
          {#each tile as arch}
            <li class='arch'>
              <ArchView arch={arch.compiled}></ArchView>
              {arch.compiled.Self}
            </li>
          {/each}
        </ol>
      </li>
    {/each}
  </ol>
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
  .tiles {
    overflow: auto;
    text-align: left;
  }
  .tile {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
  }
  .tile:nth-child(even) {
    background: rgba(128, 128, 128, 0.25);
  }
  .tile.selected {
    background: rgba(128, 196, 128, 0.5);
  }
  ol, li {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    padding-left: 0.5em;
  }
  .arch {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
  }
</style>