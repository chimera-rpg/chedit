import { parse } from 'yaml'
import type { BaseMaps, Maps, ContainerMaps, Map, ContainerMap } from '../interfaces/Map'
import type { ArchetypeContainer } from '../interfaces/Archetype'
import { cloneObject, compileInJS } from './archs'

export function loadMapsFromYAML(source: string): ContainerMaps {
  let maps: ContainerMaps = {}
  let baseMaps: Maps = parse(source)

  for (let [k, m] of Object.entries(baseMaps)) {
    let m2: ContainerMap = {}
    for (let [fieldKey, fieldValue] of Object.entries(m)) {
      if (fieldKey !== 'Tiles') {
        m2[fieldKey] = fieldValue
      }
    }
    if (m.Tiles) {
      m2.Tiles = []
      for (let y = 0; y < m.Tiles.length; y++) {
        m2.Tiles[y] = []
        for (let x = 0; x < m.Tiles[y].length; x++) {
          m2.Tiles[y][x] = []
          for (let z = 0; z < m.Tiles[y][x].length; z++) {
            m2.Tiles[y][x][z] = []
            for (let i = 0; i < m.Tiles[y][x][z].length; i++) {
              m2.Tiles[y][x][z][i] = {
                Compiled: compileInJS(cloneObject(m.Tiles[y][x][z][i]), true),
                Original: m.Tiles[y][x][z][i],
              }
            }
          }
        }
      }
    }
    maps[k] = m2
  }
  
  return maps
}