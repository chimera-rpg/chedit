import { writable } from "svelte/store"
import type { Writable } from 'svelte/store'

export interface KeysStore {
  held: {[key: string]: boolean}
}

export const keysStore: Writable<KeysStore> = writable({
  held: {}
})

window.addEventListener('keydown', (e: KeyboardEvent) => {
  let key = e.key.toLowerCase()
  if (key === 'alt') {
    e.preventDefault()
  }
  keysStore.update(v => {
    v.held[key] = true
    return v
  })
})

window.addEventListener('keyup', (e: KeyboardEvent) => {
  let key = e.key.toLowerCase()
  if (key === 'alt') {
    e.preventDefault()
  }
  keysStore.update(v => {
    delete v.held[key]
    return v
  })
})
