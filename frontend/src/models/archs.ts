import { get } from "svelte/store"
import { archetypes } from "../stores/archetypes"
import { data } from "../../wailsjs/go/models"
import merge from 'ts-deepmerge'
import { CompileArchetype } from "../../wailsjs/go/main/Editor"

type Entry = [number, data.Archetype, (value: data.Archetype|PromiseLike<data.Archetype>) => void, (reason: any) => void]

let queue: Entry[] = []
let index: number = 0
let pending: number = 0
let limit: number = 200

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

function mergeArch(to: data.Archetype, from: data.Archetype): data.Archetype {
  to = merge(to, from)
  return to
}

function addArch(to: data.Archetype, from: data.Archetype) {
  console.log('TODO: addArch!')
  return to
}

// compileInJS is used _only_ for compiling in-map archetypes.
export function compileInJS(arch: data.Archetype): data.Archetype {
  let err = resolveArchetype(arch)
  if (err) {
    throw err
  }
  if (arch.Archs.length === 0 && arch.Arch !== "") {
    arch.Archs.push(arch.Arch)
  }
  for (let dep of arch.Archs) {
    let shouldMerge = true
    if (dep[0] === '+') {
      dep = dep.substring(1)
      shouldMerge = false
    }
    let arch2 = getArchetype(dep)
    if (!arch2) {
      throw new Error(`missing dep ${dep}`)
    }
    if (shouldMerge) {
      arch = mergeArch(arch, arch2)
    } else {
      arch = addArch(arch, arch2)
    }
  }

  if (arch.Inventory) {
    for (let inv of arch.Inventory) {
      let err = compileInJS(inv)
      if (err) {
        return err
      }
    }
  }

  return arch
}

function getArchetype(name: string): data.Archetype {
  let r = get(archetypes).archetypes[name]
  if (r) {
    return r.Archetype
  }
  return undefined
}

function resolveArchetype(archetype: data.Archetype): Error {
  let resolved: {[key: string]: boolean} = {}
  let unresolved: {[key: string]: boolean} = {}

  return dependencyResolveArchetype(archetype, resolved, unresolved)
}

function dependencyResolveArchetype(archetype: data.Archetype, resolved: {[key: string]: boolean}, unresolved: {[key: string]: boolean}): Error {
  unresolved[archetype.Self] = true
  for (let dep of archetype.Archs) {
    if (dep[0] === '+') {
      dep = dep.substring(1)
    }
    let depArch = getArchetype(dep)
    if (!depArch) {
      return new Error(`${dep} missing`)
    }
    if (resolved[dep]) {
      if (unresolved[dep]) {
        return new Error(`circular dependency between ${archetype.Self} and ${dep}`)
      }
      let depErr = dependencyResolveArchetype(depArch, resolved, unresolved)
      if (depErr) {
        return depErr
      }
    }
  }
  resolved[archetype.Self] = true
  delete unresolved[archetype.Self]

  return undefined
}