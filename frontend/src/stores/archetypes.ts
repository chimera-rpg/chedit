import { writable, get, Subscriber, Writable } from 'svelte/store'
import type { data } from '../../wailsjs/go/models'
import type { main } from '../../wailsjs/go/models'
import * as ftt from '@kettek/filepaths-to-tree'

export interface ArchetypesStore {
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
      value.tree = ftt.Make(Object.keys(value.archetypes).map(v=>v+'__arch'), p => value.archetypes[p.substring(0, p.length-'__arch'.length)])
      let sortNode = (node: any): any => {
        return Object.keys(node).sort((a: string, b: string) => {
          if (a.endsWith('__arch') && !b.endsWith('__arch')) {
            return 1
          } else if (!a.endsWith('__arch') && b.endsWith('__arch')) {
            return -1
          }
          return 0
        }).reduce((obj: any, key: any) => {
          if (node[key].Archetype) {
            obj[key] = node[key]
          } else {
            obj[key] = sortNode(node[key])
          }
          return obj
        }, {})
      }
      value.tree = sortNode(value.tree)
      set(value)
    },
    update,
  }
})()