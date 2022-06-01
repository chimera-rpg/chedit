import { writable, get, Subscriber, Writable } from 'svelte/store'
import type { data } from '../../wailsjs/go/models'
import { GetBytes } from '../../wailsjs/go/main/Editor'

interface AnimationsStore {
  animations: {[key:string]: data.AnimationPre}
  images: {[key:string]: {[key:string]:number[]|undefined}}
  getImage(p: string): Promise<number[]|undefined>
  tree: any
}
 
export const animations: Writable<AnimationsStore> = ((): Writable<AnimationsStore> => {
  const { subscribe, set, update } = writable({
    animations: {},
    images: {},
    tree: {},
  })

  return {
    subscribe,
    set,
    getImage: async (anim: string, face: string): Promise<number[]|undefined> => {
      console.log('getImage', anim, face)
      if (face === "") {
        face = "default"
      }
      let a = get({subscribe})
      let i = a.images[anim]
      if (i) {
        if (i[face]) {
          return i[face]
        }
      } else {
        a.images[anim] = {}
      }

      let animation = a.animations[anim]
      if (!animation) {
        return undefined
      }
      let f = animation.Faces[face]
      if (!f) {
        return undefined
      }
      let img = f[0].Image
      if (!img) {
        return undefined
      }

      let bytes = await GetBytes(img)
      a.images[anim][face] = bytes
      set(a)
      return a.images[anim][face]
    },
    update,
  }
})()