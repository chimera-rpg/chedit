import { writable, Writable } from "svelte/store"

export interface KeysStore {
  held: {[key: string]: boolean}
}

export const keysStore: Writable<KeysStore> = writable({
  held: {}
})

window.addEventListener('keydown', (e: KeyboardEvent) => {
  keysStore.update(v => {
    v.held[e.key] = true
    return v
  })
})

window.addEventListener('keyup', (e: KeyboardEvent) => {
  keysStore.update(v => {
    delete v.held[e.key]
    return v
  })
})