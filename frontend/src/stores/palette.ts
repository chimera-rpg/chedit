import { writable, get } from "svelte/store"
import type { Subscriber, Writable } from 'svelte/store'

interface PaletteStoreData {
  selected: string[]
  focused: string
  folders: {[key: string]: boolean}
}

interface PaletteStore extends Writable<PaletteStoreData> {
  select(focused: string, selected: string[]): void
  open(path: string): void
  close(path: string): void
}

export const palette: PaletteStore = ((): PaletteStore => {
  const { subscribe, set, update } = writable({
    selected: [],
    focused: '',
    folders: {},
  })

  return {
    subscribe,
    set,
    update,
    select: (focused: string, selected: string[]): void => {
      let s = get({subscribe})
      s.focused = focused
      s.selected = selected
      set(s)
    },
    open: (path: string): void => {
      let s = get({subscribe})
      s.folders[path] = true
      set(s)
    },
    close: (path: string): void => {
      let s = get({subscribe})
      s.folders[path] = false
      set(s)
    },
  }
})()