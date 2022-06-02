<script lang="ts">
  import ArchView from '../ArchView.svelte'
  import { compile, compileInJS } from '../../models/archs'

  import type { data } from "../../../wailsjs/go/models"

  export let zoom: number = 1
  export let arch: data.Archetype
  let compiled: data.Archetype
  let err: any
  let x: number = 0
  let y: number = 0

  compiled = compileInJS(arch)
  /*compile(arch).then(v => {
    compiled = v
  }).catch(e => {
    err = e
  })*/
</script>

<div class='arch'>
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
  }
</style>