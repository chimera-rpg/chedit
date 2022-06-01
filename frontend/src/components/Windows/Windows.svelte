<script context='module'>
  export const WINDOWS = {}
</script>
<script lang='ts'>
  import { setContext, onDestroy } from 'svelte'
  import { writable } from 'svelte/store'
  import type { WindowI } from './Windows'

  const windows: WindowI[] = []

  const selectedWindow = writable({})

  setContext(WINDOWS, {
    registerWindow: (window: WindowI) => {
      windows.push(window)
      selectedWindow.update(current => current || window)

      onDestroy(() => {
        const i = windows.indexOf(window)
        windows.splice(i, 1)
        selectedWindow.update(current => current === window ? (windows[i] || windows[windows.length - 1]) : current)
      })
    },

		selectWindow: (window: WindowI) => {
			const i = windows.indexOf(window);
			selectedWindow.set(window);
		},

    selectedWindow,
	});
</script>

<slot></slot>