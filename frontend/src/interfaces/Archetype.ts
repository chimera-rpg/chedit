// It pains me to reimplement Archetypes here, as I was hoping wails would be enough, but given that server/data.Archetype converts archetypes into more optimized/machine-readable formats during unmarshalling, it quickly turns into a lot of extra work for no real reason.

export interface Archetype {
  Self: string

  Arch?: string
  Archs?: string[]

  Name?: string
  Description?: string
  Type?: string

  Anim?: string
  Face?: string

  Height?: number
  Width?: number
  Depth?: number

  Matter?: string[]
  Blocking?: string[]

  Audio?: string
  SoundSet?: string
  SoundIndex?: number

  Light?: Light

  Worth?: string
  Value?: string
  Count?: string
  Weight?: string
  Properties?: {[key: string]: string}
  Exit?: ExitInfo
  Timers?: Timer[]
  Inventory?: Archetype[]
  SkillTypes?: SkillType[]
  Skills?: {[key: SkillType]: Skill}
  CompetencyTypes?: CompetencyType[]
  Competencies?: {[key: CompetencyType]: Competency}
}

type SkillType = string

export interface Skill {
  Experience: number
}

type CompetencyType = number

export interface Competency {
  Efficiency: number
}

export interface Timer {
  Event: string
  Repeat: number
  Wait: TimeRange
}

export interface TimeRange {
  Min: number
  Max: number
}

export interface ExitInfo {
  Name?: string
  Y: number
  X: number
  Z: number
  Touch?: boolean
  Cooldown?: string
  SizeRatio?: number
  Uses?: number
  UniqueUses?: number
}

export interface Light {
  Brightness: number
  Red: number
  Green: number
  Blue: number
  Intensity: number
}