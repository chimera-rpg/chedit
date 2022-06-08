<script lang='ts'>
  import { animations as animationsStore } from '../../stores/animations'
  import { palette as paletteStore } from '../../stores/palette'
  import { slide } from 'svelte/transition'
  import type { Archetype } from '../../interfaces/Archetype'

  export let path: string = ''
  export let fullpath: string = ''
  export let node: Archetype | any
  export let depth: number = 0

  $: isArchetype = node.Compiled !== undefined

  $: open = path ? $paletteStore.folders[path]: true

  function onClick(e: MouseEvent) {
    if (node.Compiled === undefined) { 
      if (open) {
        paletteStore.close(path)
      } else {
        paletteStore.open(path)
      }
    } else {
      paletteStore.select(node.Compiled.Self, [node.Compiled.Self])
    }
  }
</script>

<main>
  {#if fullpath !== ""}
    <section style='padding-left: {depth/2}em' class:archetype={isArchetype} class:folder={!isArchetype} on:click={onClick} class:selected={isArchetype?$paletteStore.focused===node.Compiled.Self:false}>
      {#if !isArchetype}
        <article class='opener'>
          {#if open}
          📂
          {:else}
          📁
          {/if}
        </article>
      {:else}
        <article class='image'>
          {#await animationsStore.getImage(node.Compiled.Anim, node.Compiled.Face)}
            ...
          {:then bytes}
            {#if bytes}
              <img src="data:image/png;base64,{bytes}">
            {/if}
          {:catch error}
            {error}
          {/await}
        </article>
      {/if}
      {#if path}
        <span>{isArchetype?path.substring(0,path.length-'__arch'.length):path}</span>
      {:else}
        <span>root</span>
      {/if}
    </section>
  {/if}
  {#if node.Archetype === undefined && open}
    <ul transition:slide|local>
      {#each Object.keys(node) as path2 (path2)}
        <li>
          <svelte:self path={path2} fullpath={path?(path+'/'+path2):path2} node={node[path2]} depth={depth+1}></svelte:self>
        </li>
      {/each}
    </ul>
  {/if}
</main>

<style>
  main {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
  }
  article {
    min-height: 1em;
    display: grid;
    align-items: center;
    justify-content: center;
  }
  .opener {
    border: 1px solid transparent;
    align-items: center;
    justify-content: center;
    box-sizing: content-box;
    margin: 1px;
  }
  .image {
    min-width: 1.5em;
    min-height: 1.5em;
    border: 1px solid #333;
    display: grid;
    align-items: center;
    justify-content: center;
    box-sizing: content-box;
    margin: 1px;
  }
  .image img {
    image-rendering: pixelated;
    zoom: 2;
  }
  section {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    text-align: left;
    align-items: flex-end;
  }
  section.folder {
    background: rgba(64, 64, 64, 0.5);
  }
  section.selected {
    background: rgba(128, 196, 128, 0.5);
  }
  section {
    cursor: pointer;
  }
  section.archetype {
    cursor: crosshair;
  }
  ul, li {
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>