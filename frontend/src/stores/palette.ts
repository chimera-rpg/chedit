import { writable, get, Writable } from 'svelte/store'

interface PaletteStoreData {
  selected: string[]
  focused: string
}

interface PaletteStore extends Writable<PaletteStoreData> {
  select(focused: string, selected: string[]): void
}

export const palette: PaletteStore = ((): PaletteStore => {
  const { subscribe, set, update } = writable({
    selected: [],
    focused: '',
  })

  return {
    subscribe,
    set,
    update,
    select: (focused: string, selected: string[]): void => {
      console.log('uh... select', focused, selected)
      let s = get({subscribe})
      s.focused = focused
      s.selected = selected
      console.log('setting', s)
      set(s)
    },
  }
})()