<script context='module'>
  export const POPUPS = Symbol()
</script>

<script lang='ts'>
  import { setContext, onDestroy } from 'svelte'
  import type { Writable } from 'svelte/store'
  import { writable } from 'svelte/store'

  interface Popup {
    name: string;
    x: number;
    y: number;
  }

  const currentPopup: Writable<Popup> = writable({name: '', x: 0, y: 0})
  const currentSubPopup: Writable<Popup> = writable({name: '', x: 0, y: 0})

  setContext(POPUPS, {
    openPopup: (popup: string, x: number, y: number) => {
      x = Math.floor(x)
      y = Math.floor(y)
      currentPopup.set({name: popup, x, y})
      currentSubPopup.set({name: '', x, y})
    },
    closePopup: () => {
      currentPopup.set({name: '', x: 0, y: 0})
      currentSubPopup.set({name: '', x: 0, y: 0})
    },
    currentPopup,
    openSubPopup: (popup: string, x: number, y: number) => {
      x = Math.floor(x)
      y = Math.floor(y)
      currentSubPopup.set({name: popup, x, y})
    },
    closeSubPopup: () => {
      currentSubPopup.set({name: '', x: 0, y: 0})
    },
    currentSubPopup,
  })

</script>

<slot></slot>