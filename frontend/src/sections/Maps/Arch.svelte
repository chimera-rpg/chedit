<script lang="ts">
  import ArchView from '../ArchView.svelte'
  import { compile, compileInJS } from '../../models/archs'

  import type { data } from "../../../wailsjs/go/models"

  export let zoom: number = 1
  export let arch: data.Archetype
  export let zIndex: number = 0
  let compiled: data.Archetype
  let err: any

  try {
    compiled = compileInJS(arch)
  } catch(err: any) {
    console.log(err)
    compiled = arch
  }
  /*compile(arch).then(v => {
    compiled = v
  }).catch(e => {
    err = e
  })*/
</script>

<div class='arch' style='z-index: {zIndex}'>
  {#if err}
    {err}
  {:else if !compiled}
    ...
  {:else}
    <ArchView arch={compiled} zoom={zoom}></ArchView>
  {/if}
</div>

<style>
  .arch {
    position: relative;
  }
</style>