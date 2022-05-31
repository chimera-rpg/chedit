<script lang='ts'>
  import { onMount } from "svelte"
  import * as GoEditor from '../wailsjs/go/main/Editor'

  import ArchPalette from "./sections/ArchPalette.svelte"
  import MainMenu from "./sections/MainMenu.svelte"
  import Views from "./sections/Views.svelte"
  import type { data } from '../wailsjs/go/models'

  import { animations as animationStore } from './stores/animations.ts'
  import { archetypes as archetypesStore } from './stores/archetypes.ts'

  let archetypes: {[key: string]: data.Archetype} = {}

  onMount(async () =>{
    await GoEditor.Initialize()
    try {
      let archetypes = await GoEditor.GetArchetypes()
      archetypesStore.set({archetypes, tree: {}})
    } catch(err: any) {
      console.error('archetypes', err)
    }
    try {
      let animations = await GoEditor.GetAnimations()
      animationStore.set({animations, tree: {}, images: {}})
    } catch(err: any) {
      console.error('animations', err)
    }
  })
</script>

<main>
  <MainMenu></MainMenu>
  <section>
    <ArchPalette></ArchPalette>
    <Views></Views>
  </section>
</main>

<style>
  main {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-columns: minmax(0, 1fr);
    overflow: hidden;
    height: 100%;
  }
  section {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);;
    grid-template-rows: minmax(0, 1fr);
  }
</style>
