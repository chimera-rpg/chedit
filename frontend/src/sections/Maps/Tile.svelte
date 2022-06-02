<script lang='ts'>
  import Arch from "./Arch.svelte"
  import { animations } from "../../stores/animations"
  import { animationsConfig } from '../../models/config'

  export let map: data.Map
  export let tile: any = {}
  export let y: number = 0
  export let x: number = 0
  export let z: number = 0
  export let zoom: number = 1
  export let disabled: boolean = false
  export let focused: boolean = false

  let tileWidth = animationsConfig.TileWidth
  let tileHeight = animationsConfig.TileHeight

  function getPos(y: number, x: number, z: number): [number, number, number] {
    let yStep = {
      X: animationsConfig.YStep.X,
      Y: animationsConfig.YStep.Y,
    }

    let originX = 0
    let originY = map.Height * -yStep.Y
    //let originY = 0
    originX += y * yStep.X
    originY += y * yStep.Y

    originX += x * tileWidth
    originY += z * tileHeight

    let indexZ = z
    let indexX = x
    let indexY = y
    let zIndex = (indexZ * map.Height * map.Width) + (map.Depth * indexY) - indexX

    // TODO: Get frame x, y offset

    return [originX, originY, zIndex]
  }

  let [posX, posY, posZ] = getPos(y, x, z)
</script>

<div class:disabled class='tile' style='left: {posX*zoom}px; top: {posY*zoom}px; z-index: {posZ};' on:mousedown|preventDefault|stopPropagation>
  {#each tile as arch, index (index)}
    <Arch arch={arch} zoom={zoom}></Arch>
  {/each}
  {#if focused}
    <div class:focused style='width: {tileWidth*zoom}px; height: {tileHeight*zoom}px'></div>
  {/if}
</div>

<style>
  .tile {
    position: absolute;
  }
  .tile.disabled {
    pointer-events: none;
  }
  .focused {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    background: rgba(200, 100, 100, 0.5);
    border: 1px solid rgba(200, 100, 100, 0.75);
    z-index: 999999999;
  }
</style>