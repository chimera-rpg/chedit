import { writable, Writable } from "svelte/store"

export interface SettingsStore {
  showHeightNumbers: boolean
  showHeightNumbersOnAlt: boolean
  showHeightNumbersSameYOnly: boolean
  showPlacementHeightNumber: boolean
  showPlacementLines: boolean
  //
  hideSpecials: boolean
}

export const settingsStore: Writable<SettingsStore> = writable({
  showHeightNumbers: true,
  showHeightNumbersOnAlt: true,
  showHeightNumbersSameYOnly: false,
  showPlacementHeightNumber: true,
  showPlacementLines: true,
  hideSpecials: false,
})
