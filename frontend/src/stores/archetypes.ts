import { writable, get, Subscriber, Writable } from 'svelte/store'
import type { data } from '../../wailsjs/go/models'
import type { main } from '../../wailsjs/go/models'
import * as ftt from '@kettek/filepaths-to-tree'

interface ArchetypesStore {
  archetypes: {[key:string]: main.ArchetypeContainer}
  tree: any
}
 
export const archetypes: Writable<ArchetypesStore> = ((): Writable<ArchetypesStore> => {
  const { subscribe, set, update } = writable({
    archetypes: {},
    tree: {},
  })

  return {
    subscribe,
    set: (value: ArchetypesStore) => {
      set(value)
      value.tree = ftt.Make(Object.keys(value.archetypes), p => value.archetypes[p])
    },
    update,
  }
})()