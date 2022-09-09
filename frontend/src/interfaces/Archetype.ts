// It pains me to reimplement Archetypes here, as I was hoping wails would be enough, but given that server/data.Archetype converts archetypes into more optimized/machine-readable formats during unmarshalling, it quickly turns into a lot of extra work for no real reason.

export interface ArchetypeContainer {
  Compiled: Archetype
  Original: Archetype
  Error: any
}

export interface Archetype {
  Self?: string
  Compile?: ''|'compiled'|'compiling'

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
  Resistances?: AttackTypes
  AttackTypes?: AttackTypes

  Reach?: number
  Attackable?: boolean

  Damage?: Damage

  Armor?: number

  Dodge?: number
  ChannelTime?: number
  RecoveryTime?: number

  Level?: number
  Advancement?: number
  Efficiency?: number

  Attributes?: AttributeSets

  // Statuses?: // ???

  Attitudes?: Attitudes
  Genera?: string
  Species?: string
  Factions?: string[]
  Legacy?: string
  Events?: Events

  Specials?: Specials
}

export interface Events {
  Birth?: EventResponses
  Death?: EventResponses
  Hit?: EventResponses
  Attacking?: EventResponses
  Attacked?: EventResponses
  Attack?: EventResponses
  Advance?: EventResponses
  Exit?: EventResponses
}

export interface EventResponses {
  Spawn?: SpawnEventResponse
  Replace?: SpawnArchetype[]
  Trigger?: TriggerEventResponse
  Script?: ScriptEventResponse
}

type SpawnEventType = string

export interface IntRange {
  Min?: number
  Max?: number
  Not?: number[]
}

interface SpawnConditions {
  Matter?: MatterType
  Blocking?: MatterType
}

type MatterType = string

interface SpawnPlacement {
  Overlap?: boolean
  Surface?: SpawnConditions
  Air?: SpawnConditions
  X?: IntRange
  Y?: IntRange
  Z?: IntRange
}

interface SpawnArchetype {
  Chance?: number
  Archetype?: Archetype
  Count?: IntRange
  Retry?: number
  Placement?: SpawnPlacement
}

interface XYZOffset {
  X?: IntRange
  Y?: IntRange
  Z?: IntRange
}

interface SpawnEventResponse {
  Type?: SpawnEventType
  Items?: SpawnArchetype[]
}

interface TriggerEventResponse {
  Event?: string
}

type ScriptEventResponse = string

type EventType = number

export interface Attitudes {
  Genera?: {[key: string]: GeneraAttitudes}
  Factions?: {[key: string]: Attitude}
  Legacies?: {[key: string]: Attitude}
}

export interface GeneraAttitudes {
  Attitude?: Attitude
  Species?: {[key: string]: Attitude}
}

type Attitude = string

export interface AttributeSets {
  Physical?: Attributes
  Arcane?: Attributes
  Spirit?: Attributes
}
export interface Attributes  {
  Might?: number
  Prowess?: number
  Focus?: number
  Sense?: number
  Haste?: number
  Reaction?: number
}

type AttackType = string
type AttackTypes = {[key: AttackType]: AttackStyles}
type AttackStyle = string
type AttackStyles = {[key: AttackStyle]: number}

export interface Damage {
  Value?: number
  AttributeBonus?: DamageAttributeBonuses
}
type DamageAttributeBonuses = {[key: AttackType]: AttributeTypes}

type AttributeType = string
type AttributeTypes = {[key: AttributeType]: number}

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
  Red: number
  Green: number
  Blue: number
  Distance: number
  Falloff: number
}

export interface Specials {
  Haven: boolean
}