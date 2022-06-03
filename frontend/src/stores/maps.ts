import { writable, get, Subscriber, Writable } from 'svelte/store'
import type { main } from '../../wailsjs/go/models'

interface MapsStoreData {
  maps: main.MapReference[]
}

interface MapsStore extends Writable<MapsStoreData> {
  open(maps: main.MapReference): void
  close(maps: main.MapReference): void
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
        SelectedMap: Object.keys(mr.Maps)[0],
      })
      set(ms)
    },
    close: (mr: main.MapReference): void => {
      let ms = get({subscribe})
      ms.maps = ms.maps.filter(v=>v!==mr)
      set(ms)
    },
  }
})()