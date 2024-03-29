import { writable, get } from "svelte/store"
import type { Subscriber, Writable } from 'svelte/store'
import { LoadSettings, SaveSettings } from '../../wailsjs/go/main/Editor'
import type { WandRules, ReplaceRules, InsertRules, PlacingRules, CursorRules } from '../interfaces/editor'

export interface SettingsStore {
  showHeightNumbers: boolean
  showHeightNumbersOnAlt: boolean
  showHeightNumbersSameYOnly: boolean
  showPlacementHeightNumber: boolean
  showPlacementLines: boolean
  //
  showBoundingBoxes: boolean
  hideSpecials: boolean
  //
  width?: number
  height?: number
  //
  cursorRules: CursorRules
  wandRules: WandRules
  replaceRules: ReplaceRules
  insertRules: InsertRules
  placeRules: PlacingRules
}

const DefaultSettings: SettingsStore = {
  showHeightNumbers: true,
  showHeightNumbersOnAlt: true,
  showHeightNumbersSameYOnly: false,
  showPlacementHeightNumber: true,
  showPlacementLines: true,
  showBoundingBoxes: true,
  hideSpecials: false,
  cursorRules: {
    height: 1,
    width: 1,
    depth: 1,
    hollowY: false,
    hollowX: false,
    hollowZ: false,
    hollowBorder: true,
    openTop: false,
    openBottom: false,
    openLeft: false,
    openRight: false,
    openBack: false,
    openFront: false,
  },
  wandRules: {
    shouldMatchArchetypes: true,
    shouldMatchName: false,
    shouldMatchType: false,
    matchArchetypes: '',
    matchName: '',
    matchType: '',
    matchY: false,
    matchX: true,
    matchZ: true,
    diagonal: false,
  },
  replaceRules: {
    shouldMatchArchetypes: false,
    shouldMatchName: false,
    shouldMatchType: false,
    matchArchetypes: '',
    matchName: '',
    matchType: '',
    matchMode: 'entire',
    replaceMode: 'replace',
    range: [0,0],
  },
  insertRules: {
    checkForReplace: true,
    insertOnNoMatch: true,
    replaceMode: 'replace',
    shouldMatchArchetypes: false,
    shouldMatchName: false,
    shouldMatchType: true,
    matchArchetypes: '',
    matchName: '',
    matchType: '',
  },
  placeRules: {
    deduplicate: true,
    clear: false,
  }
}

interface SettingsStoreI {
  reset: () => void
  json: () => string
  save: () => void
  load: () => void
}

function createSettings(): Writable<SettingsStore>&SettingsStoreI {
  const { subscribe, set, update } = writable({...DefaultSettings})

  return {
    subscribe,
    update,
    set,
    reset: () => set({...DefaultSettings}),
    json: () => JSON.stringify(get({subscribe})),
    save: () => SaveSettings(JSON.stringify(get({subscribe}))),
    load: () => LoadSettings().then(r=>{
      if (typeof r === 'string') {
        return set({...DefaultSettings, ...JSON.parse(r)})
      }
    }),
  }
}

export const settingsStore = createSettings()

let timer: number
settingsStore.subscribe((v: SettingsStore) => {
  if (timer) {
    clearTimeout(timer)
  }
  timer = window.setTimeout(() => {
    settingsStore.save()
  }, 2000)
})