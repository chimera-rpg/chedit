import type { Unsubscriber } from 'svelte/store'
import { keysStore } from '../stores/keys'
import type { KeysStore } from '../stores/keys'

// This is a little cheaty, but whatever.
let currentBind: Binds = null

export type BindHandler = () => void

export class Binds {
  active = false
  commands: {[cmd: string]: BindHandler[]} = {}
  shortcuts: {[keys: string]: string} = {}
  unsub: Unsubscriber

  constructor() {
  }

  activate() {
    if (this.unsub) return
    this.unsub = keysStore.subscribe((s: KeysStore) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return
      let keys = Object.keys(s.held).map(v=>v.toLowerCase()).sort().join('+')
      let cmd = this.commands[this.shortcuts[keys]]
      if (cmd) {
        for (let cb of cmd) {
          cb()
        }
      }
    })
    if (currentBind != null) {
      currentBind.deactivate()
    }
    currentBind = this
  }
  deactivate() {
    if (this.unsub) {
      this.unsub()
      this.unsub = undefined
      if (currentBind == this) {
        currentBind = null
      }
    }
  }

  addHandler(cmd: string, cb: BindHandler) {
    if (!this.commands[cmd]) this.commands[cmd] = []
    this.commands[cmd].push(cb)
  }
  removeHandler(cmd: string, cb: BindHandler) {
    if (!this.commands[cmd]) return
    this.commands[cmd] = this.commands[cmd].filter(v=>v!==cb)
  }

  addShortcut(cmd: string, keys: string[]) {
    if (!this.commands[cmd]) return
    keys = keys.map(v=>v.toLowerCase()).sort()
    this.shortcuts[keys.join('+')] = cmd
  }

  removeShortcut(cmd: string, keys: string[]) {
    if (!this.commands[cmd]) return
    keys = keys.map(v=>v.toLowerCase()).sort()
    delete this.shortcuts[keys.join('+')]
  }

  addBind(cmd: string, keys: string[], cb: BindHandler) {
    this.addHandler(cmd, cb)
    this.addShortcut(cmd, keys)
  }

  trigger(cmd: string) {
    let command = this.commands[cmd]
    if (command) {
      for (let cb of command) {
        cb()
      }
    }
  }
}