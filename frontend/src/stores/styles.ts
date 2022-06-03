import { writable, get, Subscriber, Writable } from 'svelte/store'

type Colors = {[key: string]: string}

interface Styles {
  colors: Colors
}

export const defaultColors: Colors = {
  cursorBorder: '#f00',
  hoverBorder: '#fff',
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