<script lang='ts'>
  //import { data } from '../../../wailsjs/go/models'
  import { animations as animationsStore } from '../../stores/animations'

  export let path: string = ''
  export let fullpath: string = ''
  export let node: data.Archetype | any
  export let open: boolean = false

  function onClick(e: MouseEvent) {
    if (node.Archetype === undefined) { 
      open = !open
    } else {
      console.log('selected', fullpath)
    }
  }
</script>

<main>
  <section on:click={onClick}>
    {#if node.Archetype === undefined}
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
          <svelte:self path={path2} fullpath={path+'/'+path2} node={node[path2]}></svelte:self>
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
  ul, li {
    list-style: none;
    margin: 0;
    padding: 0;
    padding-left: .5em;
  }
</style>