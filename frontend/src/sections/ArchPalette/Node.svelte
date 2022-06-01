<script lang='ts'>
  //import { data } from '../../../wailsjs/go/models'
  import { animations as animationsStore } from '../../stores/animations'
  import { palette as paletteStore } from '../../stores/palette'

  export let path: string = ''
  export let fullpath: string = ''
  export let node: data.Archetype | any
  export let open: boolean = false
  export let depth: number = 0

  $: isArchetype = node.Archetype !== undefined

  function onClick(e: MouseEvent) {
    if (node.Archetype === undefined) { 
      open = !open
    } else {
      paletteStore.select(node.Archetype.Self, [node.Archetype.Self])
    }
  }
</script>

<main>
  <section style='padding-left: {depth/2}em' class:archetype={isArchetype} on:click={onClick} class:selected={$paletteStore.focused===(isArchetype?node.Archetype.Self:'')}>
    {#if !isArchetype}
      <article class='opener'>
        {#if open}
        -
        {:else}
        +
        {/if}
      </article>
    {:else}
      <article>
        {#await animationsStore.getImage(node.Archetype.Anim, node.Archetype.Face)}
          ...
        {:then bytes}
          <img src="data:image/png;base64,{bytes}">
        {:catch error}
          {error}
        {/await}
      </article>
    {/if}
    {#if path}
      <span>{path}</span>
    {:else}
      <span>root</span>
    {/if}
  </section>
  {#if node.Archetype === undefined && open}
    <ul>
      {#each Object.keys(node) as path2}
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
    min-width: 1em;
  }
  section {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    text-align: left;
  }
  section.selected {
    background: rgba(128, 128, 128, 0.5)
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