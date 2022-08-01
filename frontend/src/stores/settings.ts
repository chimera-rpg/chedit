import { get, writable, Writable } from "svelte/store"
import { LoadSettings, SaveSettings } from '../../wailsjs/go/main/Editor'

export interface SettingsStore {
  showHeightNumbers: boolean
  showHeightNumbersOnAlt: boolean
  showHeightNumbersSameYOnly: boolean
  showPlacementHeightNumber: boolean
  showPlacementLines: boolean
  //
  showBoundingBoxes: boolean
  hideSpecials: boolean
}

const DefaultSettings: SettingsStore = {
  showHeightNumbers: true,
  showHeightNumbersOnAlt: true,
  showHeightNumbersSameYOnly: false,
  showPlacementHeightNumber: true,
  showPlacementLines: true,
  showBoundingBoxes: true,
  hideSpecials: false,
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