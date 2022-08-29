import type { Undoable } from "../models/undo"
import type { ArchetypeContainer, Archetype } from "./Archetype"

export interface BaseMap {
  DataName?: string
  Name?: string
  Description?: string
  Lore?: string
  Depth?: number
  Width?: number
  Height?: number
  Darkness?: number
  Outdoor?: boolean
  ResetTime?: number
  Y?: number
  X?: number
  Z?: number
  Script?: string
}

export interface ContainerMap extends BaseMap, Undoable {
  Tiles?: ArchetypeContainer[][][][]
  export(): Map
}

export interface Map extends BaseMap {
  Tiles?: Archetype[][][][]
}

export interface MapsContainer {
  Path: string
  Maps?: ContainerMaps
  SelectedMap: string
}

export type Maps = {[key: string]: Map}
export type BaseMaps = {[key: string]: BaseMap}
export type ContainerMaps = {[key: string]: ContainerMap}