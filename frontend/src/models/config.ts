import type { data } from "../../wailsjs/go/models"

export let animationsConfig: data.AnimationsConfig = {}

export function setAnimationsConfig(cfg: data.AnimationsConfig) {
  animationsConfig = {...cfg}
}