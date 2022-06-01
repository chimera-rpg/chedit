<script lang="ts">
  import ArchView from '../ArchView.svelte'
  //import { CompileArchetype } from "../../../wailsjs/go/main/Editor"
  import { compile } from '../../models/archs'

  import type { data } from "../../../wailsjs/go/models"

  export let arch: data.Archetype
  let compiled: data.Archetype
  let err: any
  compile(arch).then(v => {
    compiled = v
    console.log('compiled')
  }).catch(e => {
    err = e
  })
</script>

<div class='arch'>
  {#if err}
    {err}
  {:else if !compiled}
    ...
  {:else}
    <ArchView anim={compiled.Anim} face={compiled.Face}></ArchView>
  {/if}
</div>

<style>
</style>