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
  import { keysStore } from "../../stores/keys"
  import { settingsStore } from "../../stores/settings"

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

  $: canvasWidth = (map.Width * animationsConfig.TileWidth) + (map.Height * animationsConfig.YStep.X) + 2
  $: canvasHeight = (map.Depth * animationsConfig.TileHeight) + (map.Height * -animationsConfig.YStep.Y) + 2

  $: onChange(zoom, map, $cursor, $settingsStore)
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
            let arch = map.Tiles[y][x][z][i]
            let di: DrawListItem = {
              arch,
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
    let originX = 0
    let originY = map.Height * -animationsConfig.YStep.Y

    originX += y * animationsConfig.YStep.X
    originY += y * animationsConfig.YStep.Y
    originX += x * animationsConfig.TileWidth
    originY += z * animationsConfig.TileHeight

    let zIndex = (z * map.Height * map.Width) + (map.Depth * y) - x

    return [originX, originY, zIndex]
  }

  function renderDrawList(dl: DrawListItem[]) {
    // Sort it first.
    dl.sort((a: DrawListItem, b: DrawListItem): number => {
      return a.zIndex - b.zIndex
    })
    for (let item of dl) {
      if ($settingsStore.hideSpecials && item.arch.Compiled.Type === 'Special') continue
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

      ctx.lineWidth = 3
      ctx.strokeStyle = '#f00'
      ctx.fillStyle = 'white'
      ctx.font = '10px Sans-serif'
      if (item.arch.Error) {
        ctx.strokeText("?", item.left*zoom, item.top * zoom)
      } else if (item.image && item.image.complete && !item.imageErr) {
        // Get adjustments.
        let x = 0
        let y = 0
        let adjustment = animationsConfig.Adjustments[item.arch.Compiled.Type]
        if (adjustment) {
          if (adjustment.X !== undefined) {
            x = adjustment.X
          }
          if (adjustment.Y !== undefined) {
            y = adjustment.Y
          }
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

        // Draw root tile positional indicator for large objects.
        let oldAlpha = ctx.globalAlpha
        if (item.arch.Compiled.Height > 1 || item.arch.Compiled.Depth > 1 || item.arch.Compiled.Width > 1) {
          let [left, top] = getCoordinatePosition(item.y-1, item.x, item.z)
          ctx.globalAlpha += 2
          ctx.fillStyle = 'red'
          ctx.fillRect((left)*zoom, (top)*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)
        }
        ctx.globalAlpha = oldAlpha

        try {
          ctx.drawImage(item.image, (x+item.left)*zoom, (y+item.top+yOffset)*zoom, item.image.naturalWidth*zoom, item.image.naturalHeight*zoom)
        } catch(err) {
          ctx.strokeText("!", item.left*zoom, item.top * zoom)
        }

        // Render extra info for exits, etc.
        if (item.arch.Compiled.Exit) {
          ctx.textAlign = 'center'
          ctx.strokeStyle = '#00f'
          ctx.strokeText("E", (x+item.left+animationsConfig.TileWidth/2)*zoom, (y+item.top+yOffset+animationsConfig.TileHeight/2) * zoom)
          ctx.fillText("E", (x+item.left+animationsConfig.TileWidth/2)*zoom, (y+item.top+yOffset+animationsConfig.TileHeight/2) * zoom)
        }
      } else if (item.imageErr) {
        ctx.strokeText("!", item.left*zoom, item.top * zoom)
      } else {
        ctx.strokeStyle = '#fff'
        ctx.strokeText("?", item.left*zoom, item.top * zoom)
      }
      // Draw bounding box around larger archetypes.
      if ($settingsStore.showBoundingBoxes) {
        if (item.arch.Compiled.Height > 1 || item.arch.Compiled.Depth > 1 || item.arch.Compiled.Width > 1) {
          ctx.lineWidth = 1
          ctx.globalAlpha = 0.5
          ctx.strokeStyle = '#ff0'
          drawBoundingBox(item.y, item.x, item.z, item.arch.Compiled.Height, item.arch.Compiled.Width, item.arch.Compiled.Depth)
        }
      }
    }
  }

  function renderHeightNumbers() {
    if (!$settingsStore.showHeightNumbers) return
    if ($settingsStore.showHeightNumbersOnAlt && !$keysStore.held.Alt) return
    ctx.globalAlpha = 0.5
    ctx.lineWidth = 3
    ctx.strokeStyle = 'black'
    ctx.fillStyle = 'white'
    ctx.font = '10px Sans-serif'
    for (let x = 0; x < map.Width; x++) {
      for (let z = 0; z < map.Depth; z++) {
        let y = getOpenPositionBelow($cursor.hover.y, x, z)
        if ($settingsStore.showHeightNumbersSameYOnly && y !== $cursor.hover.y-1) continue
        let [left, top] = getCoordinatePosition(y, x, z)
        ctx.strokeText(`${y+1}`, left * zoom + (animationsConfig.TileWidth/2)*zoom, top * zoom + (animationsConfig.TileHeight/2)*zoom)
        ctx.fillText(`${y+1}`, left * zoom + (animationsConfig.TileWidth/2)*zoom, top * zoom + (animationsConfig.TileHeight/2)*zoom)
      }
    }
    ctx.globalAlpha = 1
  }

  function renderPlacementHeightNumbers() {
    if (!$settingsStore.showPlacementHeightNumber) return
    ctx.globalAlpha = 0.5
    ctx.lineWidth = 3
    ctx.strokeStyle = 'white'
    ctx.fillStyle = 'black'
    ctx.font = '10px Sans-serif'
    // Draw hover
    let y = getOpenPositionBelow($cursor.hover.y, $cursor.hover.x, $cursor.hover.z)
    let [left, top] = getCoordinatePosition(y, $cursor.hover.x, $cursor.hover.z)
    y++
    ctx.strokeText(`${y}`, left * zoom + (animationsConfig.TileWidth/2)*zoom, top * zoom + (animationsConfig.TileHeight/2)*zoom)
    ctx.fillText(`${y}`, left * zoom + (animationsConfig.TileWidth/2)*zoom, top * zoom + (animationsConfig.TileHeight/2)*zoom)

    // Draw cursor start and end
    y = getOpenPositionBelow($cursor.start.y, $cursor.start.x, $cursor.start.z)
    ;[left, top] = getCoordinatePosition(y, $cursor.start.x, $cursor.start.z)
    y++
    ctx.strokeText(`${y}`, left * zoom + (animationsConfig.TileWidth/2)*zoom, top * zoom + (animationsConfig.TileHeight/2)*zoom)
    ctx.fillText(`${y}`, left * zoom + (animationsConfig.TileWidth/2)*zoom, top * zoom + (animationsConfig.TileHeight/2)*zoom)

    y = getOpenPositionBelow($cursor.end.y, $cursor.end.x, $cursor.end.z)
    ;[left, top] = getCoordinatePosition(y, $cursor.end.x, $cursor.end.z)
    y++
    ctx.strokeText(`${y}`, left * zoom + (animationsConfig.TileWidth/2)*zoom, top * zoom + (animationsConfig.TileHeight/2)*zoom)
    ctx.fillText(`${y}`, left * zoom + (animationsConfig.TileWidth/2)*zoom, top * zoom + (animationsConfig.TileHeight/2)*zoom)

    ctx.globalAlpha = 1
  }

  function renderSpawn() {
    ctx.globalAlpha = 0.5
    ctx.lineWidth = 3
    ctx.strokeStyle = 'white'
    ctx.fillStyle = 'black'
    ctx.font = '10px Sans-serif'

    let [left, top] = getCoordinatePosition(map.Y, map.X, map.Z)
    ctx.strokeText(`S`, left * zoom + (animationsConfig.TileWidth/2)*zoom, top * zoom + (animationsConfig.TileHeight/2)*zoom)
    ctx.fillText(`S`, left * zoom + (animationsConfig.TileWidth/2)*zoom, top * zoom + (animationsConfig.TileHeight/2)*zoom)
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
    // Draw cursor start.
    {
      ctx.strokeStyle = $styles.colors.cursorBorder
      //drawVerticalBoxLines(cursorY, cursorX, cursorZ, cursorY-1)
      drawVerticalBoxLines($cursor.start.y, $cursor.start.x, $cursor.start.z, $cursor.start.y-1)

      let [x, y] = getCoordinatePosition($cursor.start.y, $cursor.start.x, $cursor.start.z)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)

      ;[x, y] = getCoordinatePosition($cursor.start.y-1, $cursor.start.x, $cursor.start.z)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)

      ctx.globalAlpha = 0.7
      renderPositionLines($cursor.start.y, $cursor.start.x, $cursor.start.z)
      ctx.globalAlpha = 1
    }
    // Draw cursor end.
    if ($cursor.start.x !== $cursor.end.x || $cursor.start.y !== $cursor.end.y || $cursor.start.z !== $cursor.end.z) {
      ctx.globalAlpha = 0.3
      ctx.strokeStyle = $styles.colors.cursorBorder
      //drawVerticalBoxLines(cursorY, cursorX, cursorZ, cursorY-1)
      drawVerticalBoxLines($cursor.end.y, $cursor.end.x, $cursor.end.z, $cursor.end.y-1)

      let [x, y] = getCoordinatePosition($cursor.end.y, $cursor.end.x, $cursor.end.z)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)

      ;[x, y] = getCoordinatePosition($cursor.end.y-1, $cursor.end.x, $cursor.end.z)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)

      ctx.globalAlpha = 0.7
      renderPositionLines($cursor.end.y, $cursor.end.x, $cursor.end.z)
      ctx.globalAlpha = 1
    }

    // Draw hover.
    {
      let [x, y, zIndex] = getCoordinatePosition($cursor.hover.y, $cursor.hover.x, $cursor.hover.z)
      ctx.strokeStyle = $styles.colors.hoverBorder

      drawVerticalBoxLines($cursor.hover.y, $cursor.hover.x, $cursor.hover.z, $cursor.hover.y-1)

      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)

      ;[x, y] = getCoordinatePosition($cursor.hover.y-1, $cursor.hover.x, $cursor.hover.z)
      ctx.strokeRect(x*zoom, y*zoom, animationsConfig.TileWidth*zoom, animationsConfig.TileHeight*zoom)
    }
    ctx.globalAlpha = 0.5
    drawLineHelpers(getOpenPositionBelow($cursor.hover.y, $cursor.hover.x, $cursor.hover.z), $cursor.hover.x, $cursor.hover.z)
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

  function drawLineHelpers(y: number, x: number, z: number) {
    let [x1, y1] = getCoordinatePosition(y, x, z)
    let [x2, y2] = [x1+map.Width*animationsConfig.TileWidth, y1+map.Depth*animationsConfig.TileHeight]

    ctx.beginPath()

    // Left
    ctx.moveTo(x1*zoom, y1*zoom)
    ctx.lineTo(0, y1*zoom)
    ctx.moveTo(x1*zoom, (y1+animationsConfig.TileHeight)*zoom)
    ctx.lineTo(0, (y1+animationsConfig.TileHeight)*zoom)

    // Top
    ctx.moveTo(x1*zoom, y1*zoom)
    ctx.lineTo(x1*zoom, 0)
    ctx.moveTo((x1+animationsConfig.TileWidth)*zoom, y1*zoom)
    ctx.lineTo((x1+animationsConfig.TileWidth)*zoom, 0)

    // Right
    ctx.moveTo((x1+animationsConfig.TileWidth)*zoom, y1*zoom)
    ctx.lineTo((x2+animationsConfig.TileWidth)*zoom, y1*zoom)
    ctx.moveTo((x1+animationsConfig.TileWidth)*zoom, (y1+animationsConfig.TileHeight)*zoom)
    ctx.lineTo((x2+animationsConfig.TileWidth)*zoom, (y1+animationsConfig.TileHeight)*zoom)

    // Bottom
    ctx.moveTo((x1)*zoom, (y1+animationsConfig.TileHeight)*zoom)
    ctx.lineTo((x1)*zoom, (y2+animationsConfig.TileHeight)*zoom)
    ctx.moveTo((x1+animationsConfig.TileWidth)*zoom, (y1+animationsConfig.TileHeight)*zoom)
    ctx.lineTo((x1+animationsConfig.TileWidth)*zoom, (y2+animationsConfig.TileHeight)*zoom)

    ctx.stroke()
  }

  function drawBoundingBox(y: number, x: number, z: number, h: number, w: number, d: number) {
    let ysteppe = y * animationsConfig.YStep.Y
    ysteppe = ysteppe + z * animationsConfig.TileHeight

    let [ax1, ay1] = getCoordinatePosition(y, x, z)
    let [ax2, ay2] = [ax1+animationsConfig.TileWidth*w, ay1+animationsConfig.TileHeight*d]

    let [bx1, by1] = getCoordinatePosition(y+h, x, z)
    let [bx2, by2] = [bx1+animationsConfig.TileWidth*w, by1+animationsConfig.TileHeight*d]

    // bottom box
    ctx.moveTo(ax1*zoom, ay1*zoom)
    ctx.lineTo(ax2*zoom, ay1*zoom)
    ctx.lineTo(ax2*zoom, ay2*zoom)
    ctx.lineTo(ax1*zoom, ay2*zoom)
    ctx.lineTo(ax1*zoom, ay1*zoom)

    // top box
    ctx.moveTo(bx1*zoom, by1*zoom)
    ctx.lineTo(bx2*zoom, by1*zoom)
    ctx.lineTo(bx2*zoom, by2*zoom)
    ctx.lineTo(bx1*zoom, by2*zoom)
    ctx.lineTo(bx1*zoom, by1*zoom)

    // Lines between boxes.
    // left lines
    ctx.moveTo(ax1*zoom, ay1*zoom)
    ctx.lineTo(bx1*zoom, by1*zoom)
    ctx.moveTo(ax1*zoom, ay2*zoom)
    ctx.lineTo(bx1*zoom, by2*zoom)

    // right lines
    ctx.moveTo(ax2*zoom, ay1*zoom)
    ctx.lineTo(bx2*zoom, by1*zoom)
    ctx.moveTo(ax2*zoom, ay2*zoom)
    ctx.lineTo(bx2*zoom, by2*zoom)


    ctx.stroke()
  }

  function renderPositionLines(y: number, x: number, z: number) {
    if (!$settingsStore.showPlacementLines) return
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
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = zoom
    ctx.strokeRect(0, 0, canvas.width, canvas.height)
    ctx.translate(1*zoom, 1*zoom)
    renderDrawList(drawlist)
    renderSpawn()
    renderHeightNumbers()
    renderCursors()
    renderPlacementHeightNumbers()
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