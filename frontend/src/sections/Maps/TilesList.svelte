<script lang="ts">
  import { compileInJS, cloneObject } from '../../models/archs'

  import type { ContainerMap } from '../../interfaces/Map'
  import type { data } from '../../../wailsjs/go/models'
  import ArchView from '../ArchView.svelte'
  import type { ArchetypeContainer } from '../../interfaces/Archetype'
  import type { Cursor } from '../../interfaces/editor'
  import type { Writable } from 'svelte/store'

  export let map: ContainerMap

  export let cursor: Writable<Cursor>

  let tiles: ArchetypeContainer[][] = []

  $: onChange(map, $cursor)
  function onChange(...args: any) {
    let ctiles = []
    // Get the entire Y stack.
    for (let i = 0; i < map.Height; i++) {
      let p = map.Tiles[i]
      if (!p) return
      p = p[$cursor.start.x]
      if (!p) return
      p = p[$cursor.start.z]
      if (!p) return
      ctiles.push(p)
    }

    tiles = []
    for (let archs of ctiles) {
      let s = []
      for (let arch of archs) {
        s.push(arch)
      }
      tiles.push(s)
    }
  }

  let lastWheelTimestamp = 0
  function onWheel(e: WheelEvent) {
    // Limit the frequency of scrolling allowed to once per ms.
    e.preventDefault()
    e.stopPropagation()
    if (e.timeStamp - lastWheelTimestamp <= 1) return
    lastWheelTimestamp = e.timeStamp

    if (e.deltaY > 0) {
      if ($cursor.hover.y > 0) $cursor.hover.y--
    } else if (e.deltaY < 0) {
      if ($cursor.hover.y < tiles.length-1) $cursor.hover.y++
    }
  }
</script>

<div>
  <header>
    Tiles
  </header>
  <ol class='tiles' on:mousewheel={onWheel}>
    {#each tiles as tile, tileY}
      <li class='tile' class:selected={$cursor.start.y===tileY} class:hovered={$cursor.hover.y===tileY} on:click|preventDefault|stopPropagation={_=>($cursor.start.y=tileY)&&($cursor.start.i=tile.length-1)} on:dblclick|preventDefault|stopPropagation={_=>($cursor.hover.y=tileY)}>
        <span>{tileY}</span>
        <ol class='archs'>
          {#each tile as arch, archI}
            <li class='arch' class:selected={$cursor.start.i===archI&&$cursor.start.y===tileY} on:click|preventDefault|stopPropagation={_=>($cursor.start.y=tileY)&&($cursor.start.i=archI)}>
              <ArchView arch={arch.Compiled}></ArchView>
              {arch.Compiled.Name||arch.Compiled.Self}
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
    min-height: 1.5em;
  }
  .tile:nth-child(even) {
    background: rgba(128, 128, 128, 0.25);
  }
 .tile.hovered {
    background: rgba(196, 196, 196, 0.5);
  }
  .tile.selected {
    background: rgba(128, 196, 128, 0.5);
  }
  .tile > span {
    min-width: 1.2em;
  }
  .arch {
    border: 1px solid transparent;
    min-height: 1.5em;
  }
  .arch.selected {
    border-color: red;
  }
  /* I'm lazy and don't want to manually reverse the array and deal with negating values from length */
  ol {
    display: flex;
    flex-direction: column-reverse;
    justify-content: flex-end;
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