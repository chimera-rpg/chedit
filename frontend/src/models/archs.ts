import { get } from "svelte/store"
import { archetypes } from "../stores/archetypes"
import type { ArchetypesStore } from "../stores/archetypes"
import type { Archetype, ArchetypeContainer } from '../interfaces/Archetype'
import merge from 'ts-deepmerge'
import { CollectArchetypes, GetArchetypes } from "../../wailsjs/go/main/Editor"
import { parse } from "yaml"

type Entry = [number, Archetype, (value: Archetype|PromiseLike<Archetype>) => void, (reason: any) => void]

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
      let r = compileInJS(top[1], true)
      pending--
      top[2](r as unknown as Archetype)
    } catch(err: any) {
      pending--
      top[3](err as unknown as any)
    }
  }

  if (queue.length) {
    go()
  }
}

export function compile(arch: any): Promise<Archetype> {
  let entry: Entry = [
    index++,
    arch,
    undefined,
    undefined,
  ]

  let p = new Promise<Archetype>((resolve, reject) => {
    entry[2] = resolve
    entry[3] = reject
  })

  queue.push(entry)

  go()

  return p
}

function mergeArch(to: Archetype, from: Archetype): Archetype {
  to = merge(from, to)
  return to
}

function addArch(to: Archetype, from: Archetype) {
  console.log('TODO: addArch!')
  return to
}

export function cloneObject(object: any) {
  let cloned: any
  if (typeof object === 'number') {
    cloned = Number(object)
  } else if (typeof object === 'boolean') {
    cloned = Boolean(object)
  } else if (typeof object === 'string') {
    cloned = String(object)
  } else if (object == null) {
    cloned = object
  } else {
    cloned = (object instanceof Array) ? [] : {};
    for (let k in object) {
      let v = object[k]
      cloned[k] = (v instanceof Object) ? cloneObject(v) : v
    }
  }
  return cloned
}

// compileInJS is used _only_ for compiling in-map archetypes.
export function compileInJS(arch: Archetype, compile?: boolean): Archetype {
  if (!compile || arch.Compile) {
    return arch
  }
  arch.Compile = 'compiling'

  let err = resolveArchetype(arch)
  if (err) {
    throw err
  }
  if (!arch.Archs) {
    arch.Archs = []
  }
  if (arch.Archs.length === 0 && arch.Arch) {
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

    compileInJS(arch2, compile)

    if (shouldMerge) {
      arch = mergeArch(arch, arch2)
    } else {
      arch = addArch(arch, arch2)
    }
  }

  if (arch.Inventory) {
    for (let i = 0; i < arch.Inventory.length; i++) {
      arch.Inventory[i] = compileInJS(arch.Inventory[i], compile)
    }
  }
  
  arch.Compile = 'compiled'

  return arch
}

export let localArchetypes: ArchetypesStore = {archetypes: {}, tree: {}}

archetypes.subscribe((value: ArchetypesStore) => {
  localArchetypes = value
})

function getArchetype(name: string): Archetype {
  let r = localArchetypes.archetypes[name]
  if (r) {
    return r.Compiled
  }
  return undefined
}

export async function collectArchetypes() {
  localArchetypes = {archetypes: {}, tree: {}}
  await CollectArchetypes()
  let archSources = await GetArchetypes()
  for (let s of Object.values(archSources)) {
    let archs = parse(s)
    for (let [name, arch] of Object.entries(archs)) {
      arch.Self = name
      localArchetypes.archetypes[name] = {
        Original: arch,
        Compiled: cloneObject(arch),
      }
    }
  }
}

export function compileArchetypes() {
  for (let a of Object.values(localArchetypes.archetypes)) {
    a.Compiled = compileInJS(a.Compiled, true)
  }
}

export function getArchetypes(): ArchetypesStore {
  return localArchetypes
}

function resolveArchetype(archetype: Archetype): Error {
  let resolved: {[key: string]: boolean} = {}
  let unresolved: {[key: string]: boolean} = {}

  return dependencyResolveArchetype(archetype, resolved, unresolved)
}

function dependencyResolveArchetype(archetype: Archetype, resolved: {[key: string]: boolean}, unresolved: {[key: string]: boolean}): Error {
  unresolved[archetype.Self] = true
  if (!archetype.Archs && archetype.Arch) {
    archetype.Archs = [archetype.Arch]
  }
  if (archetype.Archs) {
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
  }
  resolved[archetype.Self] = true
  delete unresolved[archetype.Self]

  return undefined
}