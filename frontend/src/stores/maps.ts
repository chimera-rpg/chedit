import { writable, get, Subscriber, Writable } from 'svelte/store'
import type { main } from '../../wailsjs/go/models'

interface DecoratedMapReference extends main.MapReference {
  x: number
  y: number
  w: number
  h: number
}

interface MapsStoreData {
  maps: DecoratedMapReference[]
}

interface MapsStore extends Writable<MapsStoreData> {
  open(maps: main.MapReference): void
}
 
export const maps: MapsStore = ((): MapsStore => {
  const { subscribe, set, update } = writable({
    maps: [],
  })

  return {
    subscribe,
    set,
    update,
    open: (mr: main.MapReference): void => {
      let ms = get({subscribe})
      ms.maps.push({
        ...mr,
        x: 64, y: 64, w: 320, h: 240,
      })
      set(ms)
    },
  }
})()