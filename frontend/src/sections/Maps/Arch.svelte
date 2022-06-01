<script lang="ts">
  import ArchView from '../ArchView.svelte'
  //import { CompileArchetype } from "../../../wailsjs/go/main/Editor"
  import { compile } from '../../models/archs'

  import type { data } from "../../../wailsjs/go/models"

  export let arch: data.Archetype
</script>

<div class='arch'>
  {#await compile(arch)}
    pending
  {:then arch}
    <ArchView anim={arch.Anim} face={arch.Face}></ArchView>
  {:catch err}
    crap
  {/await}
</div>

<style>
</style>