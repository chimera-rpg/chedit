import { parse } from 'yaml'
import type { Maps } from '../interfaces/Map'

function loadMapsFromYAML(source: string): Maps {
  let maps: Maps = parse(source)

  return maps
}