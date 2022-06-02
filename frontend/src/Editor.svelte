<script lang='ts'>
  import { onMount } from "svelte"
  import * as GoEditor from '../wailsjs/go/main/Editor'

  import ArchPalette from "./sections/ArchPalette.svelte"
  import MainMenu from "./sections/MainMenu.svelte"
  import Views from "./sections/Views.svelte"

  import SplitPane from "./components/SplitPane.svelte"

  import { animations as animationStore } from './stores/animations'
  import { archetypes as archetypesStore } from './stores/archetypes'

  import { setAnimationsConfig } from './models/config'

  onMount(async () =>{
    await GoEditor.Initialize()
    try {
      let archetypes = await GoEditor.GetArchetypes()
      archetypesStore.set({archetypes, tree: {}})
    } catch(err: any) {
      console.error('archetypes', err)
    }
    try {
      // Get our animations config since we're storing that in our animation store.
      let animationConfig = await GoEditor.GetAnimationsConfig()
      setAnimationsConfig(animationConfig)

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
    <SplitPane type='horizontal' pos={15}>
      <ArchPalette slot=a></ArchPalette>
      <Views slot=b></Views>
    </SplitPane>
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
    grid-template-columns: minmax(0, 1fr);;
    grid-template-rows: minmax(0, 1fr);
  }
</style>
