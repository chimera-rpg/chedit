<script lang='ts'>
  export let map: data.Map
  export let tile: any = {}
  export let y: number = 0
  export let x: number = 0
  export let z: number = 0
  export let zoom: number

  function getPos(y: number, x: number, z: number): [number, number, number] {
    let tileWidth = 8
    let tileHeight = 4
    let yStep = {
      X: 1,
      Y: 2,
    }
    let xOffset = y * yStep.X
    let yOffset = y * -yStep.Y

    let oX = x * tileWidth + xOffset
    let oY = y * tileHeight + yOffset

    // TODO: Get object h, w, d
    let [oH, oW, oD] = [1, 1, 1]

    // TODO: Get animationsconfig-> adjustment for ox and oy

    let indexZ = z
    let indexX = x
    let indexY = y
    let zIndex = (indexZ * map.Height * map.Width) + (map.Depth * y) - indexX

    // TODO: Get frame x, y offset

    return [oX, oY, zIndex]
  }

  let [posX, posY, posZ] = getPos(y, x, z)
</script>

<div class='tile' style='left: {posX*zoom}px; top: {posY*zoom}px; z-index: {posZ};'>
</div>

<style>
  .tile {
    position: absolute;
    border: 1px solid white;
    width: 8px;
    height: 8px;
  }
</style>