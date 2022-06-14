<script lang="ts">
  import { animationsConfig } from "../../models/config"
  import { compileInJS } from "../../models/archs"
  import { animations } from "../../stores/animations"
  import { styles } from '../../stores/styles'
  import type { Cursor } from '../../interfaces/editor'

  import { onMount } from "svelte"

  import type { data } from "../../../wailsjs/go/models"
  import type { ContainerMap } from '../../interfaces/Map'
  import type { ArchetypeContainer } from '../../interfaces/Archetype'
  import { get, Writable } from "svelte/store"
  import { maps, MapsStoreData } from "../../stores/maps"

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  export let zoom: number = 1
  export let map: ContainerMap

  export let cursor: Writable<Cursor>

  export let fadeAbove: boolean = true
  export let fadeBelow: boolean = false
  export let fadeFront: boolean = false
  export let fadeBehind: boolean = false
  export let fadeLeft: boolean = false
  export let fadeRight: boolean = false

  $: canvasWidth = (map.Width * animationsConfig.TileWidth) + (map.Height * animationsConfig.YStep.X)
  $: canvasHeight = (map.Depth * animationsConfig.TileHeight) + (map.Height * -animationsConfig.YStep.Y)

  $: onChange(zoom, map, $cursor)
  function onChange(...args: any) {
    //pendingRender()
    render()
  }

  interface DrawListItem {
    arch: ArchetypeContainer
    left: number
    top: number
    zIndex: number
    //
    x: number
    y: number
    z: number
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
              left: x3,
              top: y3,
              y: y,
              x: x,
              z: z,
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

  // TODO: allow image invalidation.
  let imageStore: {[key: string]: {[key: string]: HTMLImageElement}} = {}

  function collectDrawListImages() {
    for (let di of drawlist) {
      if (imageStore[di.arch.Compiled.Anim]?.[di.arch.Compiled.Face]) {
        di.image = imageStore[di.arch.Compiled.Anim][di.arch.Compiled.Face]
        continue
      }
      animations.getImage(di.arch.Compiled.Anim, di.arch.Compiled.Face).then((bytes: string) => {
        if (!imageStore[di.arch.Compiled.Anim]) {
          imageStore[di.arch.Compiled.Anim] = {}
        }
        di.image = new Image()
        di.image.onload = (ev: Event) => {
          pendingRender()
        }
        di.image.onerror = (err: any) => {
          di.imageErr = err
          pendingRender()
        }
        di.image.src = "data:image/png;base64,"+bytes
        imageStore[di.arch.Compiled.Anim][di.arch.Compiled.Face] = di.image
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
      if (fadeAbove && item.y > $cursor.hover.y) {
        ctx.globalAlpha = 0.2
      } else if (fadeBelow && item.y < $cursor.hover.y) {
        ctx.globalAlpha = 0.2
      } else if (fadeLeft && item.x < $cursor.hover.x) {
        ctx.globalAlpha = 0.2
      } else if (fadeRight && item.x > $cursor.hover.x) {
        ctx.globalAlpha = 0.2
      } else if (fadeBehind && item.z < $cursor.hover.z) {
        ctx.globalAlpha = 0.2
      } else if (fadeFront && item.z > $cursor.hover.z) {
        ctx.globalAlpha = 0.2
      } else {
        ctx.globalAlpha = 1
      }

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
          ctx.drawImage(item.image, (x+item.left)*zoom, (y+item.top+yOffset)*zoom, item.image.naturalWidth*zoom, item.image.naturalHeight*zoom)
        } catch(err) {
          ctx.strokeText("!", item.left*zoom, item.top * zoom)
        }
      } else if (item.imageErr) {
        ctx.strokeText("!", item.left*zoom, item.top * zoom)
      } else {
        ctx.strokeStyle = '#fff'
        ctx.strokeText("?", item.left*zoom, item.top * zoom)
      }
    }
  }

  function renderCursors() {
    ctx.translate(.5, .5)
    ctx.lineWidth = 1
    // Draw placing.
    ctx.strokeStyle = $styles.colors.placingBorder
    ctx.globalAlpha = 0.5
    for (let t of $cursor.placing) {
      let y1 = t.y + $cursor.hover.y
      let x1 = t.x + $cursor.hover.x
      let z1 = t.z + $cursor.hover.z
      drawVerticalBoxLines(y1, x1, z1, y1-1)

      let [x, y] = getCoordinatePosition(y1, x1, z1)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)

      ;[x, y] = getCoordinatePosition(y1-1, x1, z1)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)
    }

    // Draw selected.
    ctx.strokeStyle = $styles.colors.selectedBorder
    ctx.globalAlpha = 0.4
    for (let t of $cursor.selected) {
      drawVerticalBoxLines(t.y, t.x, t.z, t.y-1)

      let [x, y] = getCoordinatePosition(t.y, t.x, t.z)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)

      ;[x, y] = getCoordinatePosition(t.y-1, t.x, t.z)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)
    }
    // Draw selecting.
    ctx.strokeStyle = $styles.colors.selectingBorder
    ctx.globalAlpha = 0.6
    for (let t of $cursor.selecting) {
      drawVerticalBoxLines(t.y, t.x, t.z, t.y-1)

      let [x, y] = getCoordinatePosition(t.y, t.x, t.z)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)

      ;[x, y] = getCoordinatePosition(t.y-1, t.x, t.z)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)
    }
    ctx.globalAlpha = 1
    // Draw active cursor.
    {
      ctx.strokeStyle = $styles.colors.cursorBorder
      //drawVerticalBoxLines(cursorY, cursorX, cursorZ, cursorY-1)
      drawVerticalBoxLines($cursor.start.y, $cursor.start.x, $cursor.start.z, $cursor.start.y-1)

      let [x, y] = getCoordinatePosition($cursor.start.y, $cursor.start.x, $cursor.start.z)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)

      ;[x, y] = getCoordinatePosition($cursor.start.y-1, $cursor.start.x, $cursor.start.z)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)
    }
    ctx.globalAlpha = 0.7
    renderPositionLines($cursor.start.y, $cursor.start.x, $cursor.start.z)
    ctx.globalAlpha = 1
    // Draw hover $cursor.start.
    {
      let [x, y, zIndex] = getCoordinatePosition($cursor.hover.y, $cursor.hover.x, $cursor.hover.z)
      ctx.strokeStyle = $styles.colors.hoverBorder

      drawVerticalBoxLines($cursor.hover.y, $cursor.hover.x, $cursor.hover.z, $cursor.hover.y-1)

      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)

      ;[x, y] = getCoordinatePosition($cursor.hover.y-1, $cursor.hover.x, $cursor.hover.z)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)
    }
    ctx.globalAlpha = 0.7
    renderPositionLines($cursor.hover.y, $cursor.hover.x, $cursor.hover.z)
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
    ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    renderDrawList(drawlist)
    renderCursors()
  }


  onMount(() => {
    drawlist = buildDrawList()
    collectDrawListImages()
    pendingRender()
    let unsub = maps.subscribe((v: MapsStoreData) => {
      drawlist = buildDrawList()
      collectDrawListImages()
      pendingRender()
    })
    return () => {
      unsub()
    }
  })
</script>

<canvas bind:this={canvas} width={canvasWidth * zoom} height={canvasHeight * zoom + 1}>
</canvas>

<style>
</style>