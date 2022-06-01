import { data } from "../../wailsjs/go/models"
import { CompileArchetype } from "../../wailsjs/go/main/Editor"

type Entry = [number, data.Archetype, (value: data.Archetype|PromiseLike<data.Archetype>) => void, (reason: any) => void]

let queue: Entry[] = []
let index: number = 0
let pending: number = 0
let limit: number = 500

async function go() {
  if (pending > limit) return
  let top = queue.shift()
  if (top) {
    pending++
    try {
      let r = await CompileArchetype(top[1])
      pending--
      top[2](r as unknown as data.Archetype)
    } catch(err: any) {
      pending--
      top[3](err as unknown as any)
    }
  }

  if (queue.length) {
    go()
  }
}

export function compile(arch: any): Promise<data.Archetype> {
  let entry: Entry = [
    index++,
    arch,
    undefined,
    undefined,
  ]

  let p = new Promise<data.Archetype>((resolve, reject) => {
    entry[2] = resolve
    entry[3] = reject
  })

  queue.push(entry)

  go()

  return p
}