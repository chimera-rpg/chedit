<script lang='ts'>
  import { animationsConfig } from '../models/config'
  import type { data } from '../../wailsjs/go/models'

  import { animations as animationsStore } from '../stores/animations'
  import type { Archetype } from '../interfaces/Archetype'

  export let arch: Archetype
  export let anim: string = arch.Anim
  export let face: string = arch.Face || 'default'
  export let zoom: number = 1

  let x: number = 0
  let y: number = 0
  let yOffset: number = 0

  $: onChange(arch, anim, face)
  function onChange(...args: any) {
    anim = arch.Anim
    face = arch.Face || 'default'

    // Get our archetype adjustment offset.
    let adjustment = animationsConfig.Adjustments[arch.Type]
    if (adjustment) {
      x = adjustment.X
      y = adjustment.Y
    }

    // Get our frame adjustment offset.
    let frame: data.AnimationFramePre = $animationsStore.animations[anim]?.Faces[face]?.[0]
    if (frame) {
      x += frame.X
      y += frame.Y
    }
  }

  function handleLoad(e: Event) {
    let target = e.target as HTMLImageElement
    if ((arch.Height > 1 || arch.Depth > 1) && target.naturalHeight > animationsConfig.TileHeight) {
      yOffset = -(target.naturalHeight - animationsConfig.TileHeight)
    }
  }

</script>

<span>
  {#await animationsStore.getImage(anim, face)}
    ...
  {:then bytes}
    <img on:load={handleLoad} src="data:image/png;base64,{bytes}" style="left: {x}px; top: {y+yOffset}px; zoom: {zoom};">
  {:catch error}
    {error}
  {/await}
</span>


<style>
  span {
    min-width: 2em;
    display: grid;
    align-items: center;
    justify-content: center;
  }
  img {
    image-rendering: pixelated;
  }
</style>