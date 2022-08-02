import { writable, get } from 'svelte/store'
import type { Subscriber, Writable } from 'svelte/store'
import type { data } from '../../wailsjs/go/models'
import { GetBytes } from '../../wailsjs/go/main/Editor'

interface AnimationsStore {
  animations: {[key:string]: data.AnimationPre}
  images: {[key:string]: {[key:string]:number[]|undefined}}
  getImage(anim: string, face: string): Promise<number[]|undefined>
  tree: any
}

let pending: {[key:string]: {[key:string]: ({resolve: (result: number[]) => void, reject: (err: any) => void})[]}} = {}
let images: {[key:string]: {[key:string]:number[]|undefined}} = {}
 
export const animations: Writable<AnimationsStore> = ((): Writable<AnimationsStore> => {
  const { subscribe, set, update } = writable({
    animations: {},
    images: {},
    tree: {},
  })

  return {
    subscribe,
    set,
    getImage: (anim: string, face: string): Promise<number[]|undefined> => {
      let resolve: (v: number[]|undefined) => void
      let reject: (e: any) => void
      let p = new Promise((res: (v: number[]|undefined) => void, rej: (e: any) => void) => {
        resolve = res
        reject = rej
      })
      if (face === "") {
        face = "default"
      }
      let a = get({subscribe})
      let i = images[anim]
      if (i) {
        if (i[face]) {
          resolve(i[face])
          return p
        }
      } else {
        images[anim] = {}
      }

      let animation = a.animations[anim]
      if (!animation) {
        resolve(undefined)
        return p
      }
      let f = animation.Faces[face]
      if (!f) {
        resolve(undefined)
        return p
      }
      let img = f[0].Image
      if (!img) {
        resolve(undefined)
        return p
      }

      if (!pending[anim]) {
        pending[anim] = {}
      }
      if (!pending[anim][face]) {
        pending[anim][face] = []
      }
      if (pending[anim][face].length > 0) {
        pending[anim][face].push({resolve, reject})
      } else {
        pending[anim][face].push({resolve, reject})
        GetBytes(img).then((v: number[]) => {
          images[anim][face] = v
          for (let p of pending[anim][face]) {
            p.resolve(v)
          }
          pending[anim][face] = []
        }).catch((err: any) => {
          for (let p of pending[anim][face]) {
            p.reject(err)
          }
          pending[anim][face] = []
        })
      }
      return p
    },
    update,
  }
})()