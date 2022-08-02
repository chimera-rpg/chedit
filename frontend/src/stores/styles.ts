import { writable, get } from "svelte/store"
import type { Subscriber, Writable } from 'svelte/store'

type Colors = {[key: string]: string}

interface Styles {
  colors: Colors
}

export const defaultColors: Colors = {
  cursorBorder: '#f00',
  hoverBorder: '#fff',
  selectedBorder: '#ff0',
  selectingBorder: '#ff0',
  placingBorder: '#00f',
}

export const styles: Writable<Styles> = ((): Writable<Styles> => {
  const { subscribe, set, update } = writable({
    colors: {...defaultColors},
  })

  return {
    subscribe,
    set,
    update,
  }
})()