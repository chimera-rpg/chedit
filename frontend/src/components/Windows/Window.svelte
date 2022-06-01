<script lang='ts'>
	import { getContext } from 'svelte';
	import { WINDOWS } from './Windows.svelte'
  import type { WindowI } from './Windows'

	const win: WindowI = {
    x: 32,
    y: 32,
    width: window.innerWidth/2,
    height: window.innerHeight/2,
  };

	const { registerWindow, selectWindow, selectedWindow } = getContext(WINDOWS);

  registerWindow(win)

  let dragging: boolean = false

  let startX = 0
  let startY = 0
  function updatePosition(event: MouseEvent) {
    win.x += event.clientX - startX
    win.y += event.clientY - startY
    startX = event.clientX
    startY = event.clientY
  }

  function drag(node: HTMLElement, callback: any) {
		const onmousedown = (event: MouseEvent) => {
			if (event.which !== 1) return;
      startX = event.clientX
      startY = event.clientY

			event.preventDefault();

			dragging = true;

			const onmouseup = () => {
				dragging = false;

				window.removeEventListener('mousemove', callback, false);
				window.removeEventListener('mouseup', onmouseup, false);
			};

			window.addEventListener('mousemove', callback, false);
			window.addEventListener('mouseup', onmouseup, false);
		}

		node.addEventListener('mousedown', onmousedown, false);

		return {
			destroy() {
				node.removeEventListener('mousedown', onmousedown, false);
			}
		};
  }

</script>

<section class:window class:selected={$selectedWindow === win} on:click={_=>selectWindow(win)} style="left: {win.x}px; top: {win.y}px; width: {win.width}px; height: {win.height}px">
  <header use:drag={updatePosition}>
    <slot name="header"></slot>
  </header>
  <slot></slot>
</section>

<style>
  section.window {
    position: absolute;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
  }
	.selected {
		border-bottom: 2px solid teal;
		color: #333;
	}
  header {
    border: 1px solid red;
  }
  article {
    overflow: hidden;
  }
</style>

