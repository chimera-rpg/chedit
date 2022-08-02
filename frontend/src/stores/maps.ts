import { writable, get } from "svelte/store"
import type { Subscriber, Writable } from 'svelte/store'
import type { main } from '../../wailsjs/go/models'
import type { MapsContainer } from '../interfaces/Map'

export interface MapsStoreData {
  maps: MapsContainer[]
}

interface MapsStore extends Writable<MapsStoreData> {
  open(maps: MapsContainer): void
  close(maps: MapsContainer): void
}

export const maps: MapsStore = ((): MapsStore => {
  const { subscribe, set, update } = writable({
    maps: [],
  })

  return {
    subscribe,
    set,
    update,
    open: (mr: MapsContainer): void => {
      let ms = get({subscribe})
      ms.maps.push({
        ...mr,
        SelectedMap: Object.keys(mr.Maps)[0],
      })
      set(ms)
    },
    close: (mr: MapsContainer): void => {
      let ms = get({subscribe})
      ms.maps = ms.maps.filter(v=>v!==mr)
      set(ms)
    }
  }
})()