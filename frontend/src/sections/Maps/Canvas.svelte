<script lang="ts">
  import { animationsConfig } from "../../models/config"
  import { compileInJS } from "../../models/archs"
  import { animations } from "../..//stores/animations"

  import { onMount } from "svelte"

  import type { data } from "../../../wailsjs/go/models"
  import { get } from "svelte/store"

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  export let zoom: number = 1
  export let map: data.Map

  $: canvasWidth = (map.Width * animationsConfig.TileWidth) + (map.Height * animationsConfig.YStep.X)
  $: canvasHeight = (map.Depth * animationsConfig.TileHeight) + (map.Height * -animationsConfig.YStep.Y)

  $: onChange(zoom, map)
  function onChange(...args: any) {
    render()
  }

  interface DrawListItem {
    arch: data.Archetype
    compiled?: data.Archetype
    x: number
    y: number
    zIndex: number
    //
    frame: data.AnimationFramePre
    image?: HTMLImageElement
    imageSrc?: string
  }

  function buildDrawList(): DrawListItem[] {
    let anims = get(animations).animations
    let dl: DrawListItem[] = []
    let x1 = 0
    let y1 = map.Height * -animationsConfig.YStep.Y
    for (let y = 0; y < map.Tiles.length; y++) {
      let x2 = x1 + y * animationsConfig.YStep.X
      let y2 = y1 + y * animationsConfig.YStep.Y
      for (let x = 0; x < map.Tiles[y].length; x++) {
        let x3 = x2 + x * animationsConfig.TileWidth
        for (let z = 0; z < map.Tiles[y][x].length; z++) {
          let y3 = y2 + z * animationsConfig.TileHeight
          for (let i = 0; i < map.Tiles[y][x][z].length; i++) {
            let zIndex = (z * map.Height * map.Width) + (map.Depth * y) - x
            let di: DrawListItem = {
              arch: map.Tiles[y][x][z][i],
              x: x3,
              y: y3,
              zIndex: zIndex,
              frame: null,
            }
            try {
              di.compiled = compileInJS(di.arch)
            } catch(err) {
              di.compiled = di.arch
            }
            di.frame = anims[di.compiled.Anim]?.Faces[di.compiled.Face][0]
            dl.push(di)
          }
        }
      }
    }
    return dl
  }

  function collectDrawListImages() {
    for (let di of drawlist) {
      animations.getImage(di.compiled.Anim, di.compiled.Face).then((bytes: string) => {
        di.image = new Image()
        di.image.onload = _ => {
          render()
        }
        di.image.src = "data:image/png;base64,"+bytes
      }).catch((err: any) => {
        console.log(err)
      })
    }
  }

  function renderDrawList(dl: DrawListItem[]) {
    // Sort it first.
    dl.sort((a: DrawListItem, b: DrawListItem): number => {
      return a.zIndex - b.zIndex
    })
    ctx.strokeStyle = '#f00'
    for (let item of dl) {
      if (item.image && item.image.complete) {
        // Get adjustments.
        let x = 0
        let y = 0
        let adjustment = animationsConfig.Adjustments[item.compiled.Type]
        if (adjustment) {
          x = adjustment.X
          y = adjustment.Y
        }
        if (item.frame) {
          x += item.frame.X
          y += item.frame.Y
        }
        // Get local offsets.
        let yOffset = 0
        if ((item.compiled.Height > 1 || item.compiled.Depth > 1) && item.image.naturalHeight > animationsConfig.TileHeight) {
          yOffset = -(item.image.naturalHeight - animationsConfig.TileHeight)
        }

        ctx.drawImage(item.image, (x+item.x)*zoom, (y+item.y+yOffset)*zoom, item.image.naturalWidth*zoom, item.image.naturalHeight*zoom)
      } else {
        ctx.strokeText("?", item.x*zoom, item.y * zoom)
      }
    }
  }

  let drawlist: DrawListItem[]
  function render() {
    if (!canvas) return
    console.log('render')
    ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    renderDrawList(drawlist)
  }

  onMount(() => {
    drawlist = buildDrawList()
    collectDrawListImages()
    render()
  })
</script>

<canvas bind:this={canvas} on:mousemove={render} width={canvasWidth * zoom} height={canvasHeight * zoom}>
</canvas>

<style>
</style>