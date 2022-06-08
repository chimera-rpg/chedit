<script lang="ts">
  import { animationsConfig } from "../../models/config"
  import { compileInJS } from "../../models/archs"
  import { animations } from "../../stores/animations"
  import { styles } from '../../stores/styles'

  import { onMount } from "svelte"

  import type { data } from "../../../wailsjs/go/models"
  import type { ContainerMap } from '../../interfaces/Map'
  import type { ArchetypeContainer } from '../../interfaces/Archetype'
  import { get } from "svelte/store"

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  export let zoom: number = 1
  export let map: ContainerMap

  export let cursorY = 0
  export let cursorX = 0
  export let cursorZ = 0
  export let hoverY = 0
  export let hoverX = 0
  export let hoverZ = 0

  $: canvasWidth = (map.Width * animationsConfig.TileWidth) + (map.Height * animationsConfig.YStep.X)
  $: canvasHeight = (map.Depth * animationsConfig.TileHeight) + (map.Height * -animationsConfig.YStep.Y)

  $: onChange(zoom, map, cursorY, cursorX, cursorZ, hoverY, hoverX, hoverZ)
  function onChange(...args: any) {
    //pendingRender()
    render()
  }

  interface DrawListItem {
    arch: ArchetypeContainer
    x: number
    y: number
    zIndex: number
    //
    frame: data.AnimationFramePre
    image?: HTMLImageElement
    imageSrc?: string
    imageErr?: any
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
            di.frame = anims[di.arch.Compiled.Anim]?.Faces[di.arch.Compiled.Face][0]
            dl.push(di)
          }
        }
      }
    }
    return dl
  }

  let pendingRenderId: NodeJS.Timeout

  function pendingRender() {
    if (pendingRenderId) {
      clearTimeout(pendingRenderId)
      pendingRenderId = null
    } else {
      pendingRenderId = setTimeout(() => {
        render()
      }, 0)
    }
  }

  function collectDrawListImages() {
    for (let di of drawlist) {
      animations.getImage(di.arch.Compiled.Anim, di.arch.Compiled.Face).then((bytes: string) => {
        di.image = new Image()
        di.image.onload = (ev: Event) => {
          pendingRender()
        }
        di.image.onerror = (err: any) => {
          di.imageErr = err
          pendingRender()
        }
        di.image.src = "data:image/png;base64,"+bytes
      }).catch((err: any) => {
        di.imageErr = err
        pendingRender()
      })
    }
  }

  function getCoordinatePosition(y: number, x: number, z: number): [number, number, number] {
    let x1 = 0
    let y1 = map.Height * -animationsConfig.YStep.Y
    let x2 = x1 + y * animationsConfig.YStep.X
    let y2 = y1 + y * animationsConfig.YStep.Y
    let x3 = x2 + x * animationsConfig.TileWidth
    let y3 = y2 + z * animationsConfig.TileHeight
    let zIndex = (z * map.Height * map.Width) + (map.Depth * y) - x

    return [x3, y3, zIndex]
  }

  function renderDrawList(dl: DrawListItem[]) {
    // Sort it first.
    dl.sort((a: DrawListItem, b: DrawListItem): number => {
      return a.zIndex - b.zIndex
    })
    for (let item of dl) {
      ctx.strokeStyle = '#f00'
      if (item.image && item.image.complete && !item.imageErr) {
        // Get adjustments.
        let x = 0
        let y = 0
        let adjustment = animationsConfig.Adjustments[item.arch.Compiled.Type]
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
        if ((item.arch.Compiled.Height > 1 || item.arch.Compiled.Depth > 1) && item.image.naturalHeight > animationsConfig.TileHeight) {
          yOffset = -(item.image.naturalHeight - animationsConfig.TileHeight)
        }

        try {
          ctx.drawImage(item.image, (x+item.x)*zoom, (y+item.y+yOffset)*zoom, item.image.naturalWidth*zoom, item.image.naturalHeight*zoom)
        } catch(err) {
          ctx.strokeText("!", item.x*zoom, item.y * zoom)
        }
      } else if (item.imageErr) {
        ctx.strokeText("!", item.x*zoom, item.y * zoom)
      } else {
        ctx.strokeStyle = '#fff'
        ctx.strokeText("?", item.x*zoom, item.y * zoom)
      }
    }
  }

  function renderCursors() {
    ctx.translate(.5, .5)
    // Draw active cursor.
    {
      ctx.lineWidth = 1
      ctx.strokeStyle = $styles.colors.cursorBorder
      drawVerticalBoxLines(cursorY, cursorX, cursorZ, cursorY-1)

      let [x, y] = getCoordinatePosition(cursorY, cursorX, cursorZ)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)

      ;[x, y] = getCoordinatePosition(cursorY-1, cursorX, cursorZ)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)
    }
    ctx.globalAlpha = 0.5
    renderPositionLines(cursorY, cursorX, cursorZ)
    ctx.globalAlpha = 1
    // Draw hover cursor
    {
      let [x, y, zIndex] = getCoordinatePosition(hoverY, hoverX, hoverZ)
      ctx.lineWidth = 1
      ctx.strokeStyle = $styles.colors.hoverBorder

      drawVerticalBoxLines(hoverY, hoverX, hoverZ, hoverY-1)

      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)

      ;[x, y] = getCoordinatePosition(hoverY-1, hoverX, hoverZ)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)
    }
    ctx.globalAlpha = 0.5
    renderPositionLines(hoverY, hoverX, hoverZ)
    ctx.globalAlpha = 1
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  function getOpenPositionBelow(y: number, x: number, z: number): number {
    let i = y-1
    for (; i > 0; i--) {
      if (!map.Tiles[i]) continue
      if (!map.Tiles[i][x]) continue
      if (!map.Tiles[i][x][z]) continue
      let blocks = false
      for (let a of map.Tiles[i][x][z]) {
        if (!a.Compiled.Blocking) continue
        if (a.Compiled.Blocking.includes('Solid') && a.Compiled.Blocking.includes('Physical')) {
          blocks = true
          break
        }
      }
      if (blocks) {
        break
      }
    }
    return i
  }

  function drawVerticalBoxLines(y: number, x: number, z: number, y_: number) {
    let [x1, y1] = getCoordinatePosition(y, x, z)
    let [x2, y2] = getCoordinatePosition(y_, x, z)
    // draw box lines
    ctx.beginPath()
    ctx.moveTo(x1*zoom, y1*zoom)
    ctx.lineTo(x2*zoom, y2*zoom)

    ctx.moveTo((x1+animationsConfig.TileWidth)*zoom, y1*zoom)
    ctx.lineTo((x2+animationsConfig.TileWidth)*zoom, y2*zoom)

    ctx.moveTo((x1+animationsConfig.TileWidth)*zoom, (y1+animationsConfig.TileHeight)*zoom)
    ctx.lineTo((x2+animationsConfig.TileWidth)*zoom, (y2+animationsConfig.TileHeight)*zoom)

    ctx.moveTo(x1*zoom, (y1+animationsConfig.TileHeight)*zoom)
    ctx.lineTo(x2*zoom, (y2+animationsConfig.TileHeight)*zoom)

    ctx.stroke()
  }

  function renderPositionLines(y: number, x: number, z: number) {
    let i = getOpenPositionBelow(y, x, z)
    if (i >= 0) {
      drawVerticalBoxLines(y, x, z, i)
    }
  }

  let drawlist: DrawListItem[]
  function render() {
    if (!canvas) return
    console.log('render')
    ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    renderDrawList(drawlist)
    renderCursors()
  }

  onMount(() => {
    console.log('mount')
    drawlist = buildDrawList()
    collectDrawListImages()
    pendingRender()
  })
</script>

<canvas bind:this={canvas} width={canvasWidth * zoom} height={canvasHeight * zoom + 1}>
</canvas>

<style>
</style>