<script lang='ts'>
	import { getContext } from 'svelte';
	import { WINDOWS } from './Windows.svelte'
  import type { WindowI } from './Windows'
  import { scale } from 'svelte/transition'
  import { createEventDispatcher } from 'svelte'

  export let hasModal: boolean = false

	const win: WindowI = {
    x: 32,
    y: 32,
    width: window.innerWidth/2,
    height: window.innerHeight/2,
    maximized: false,
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

  function updateSize(event: MouseEvent) {
    win.width += event.clientX - startX
    win.height += event.clientY - startY
    startX = event.clientX
    startY = event.clientY
    if (win.width < 100) {
      win.width = 100
    }
    if (win.height < 100) {
      win.height = 100
    }
  }

  function maximizeWindow() {
    win.maximized = !win.maximized
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

  const dispatch = createEventDispatcher()

  function closeWindow() {
    dispatch('close')
  }

</script>

<section transition:scale class:dragging={dragging} class:window class:selected={$selectedWindow === win} class:maximized={win.maximized} on:click={_=>selectWindow(win)} on:dblclick={_=>maximizeWindow(win)} style="left: {win.x}px; top: {win.y}px; width: {win.width}px; height: {win.height}px">
  <header use:drag={updatePosition}>
    <nav class='header'>
      <slot name="header"></slot>
    </nav>
    <nav class='buttons'>
      <button on:click={closeWindow}>✖</button>
    </nav>
  </header>
  <div class='content'>
    <slot></slot>
    {#if hasModal}
      <div class='modal__blocker'></div>
      <div class='modal'>
        <slot name="modal"></slot>
      </div>
    {/if}
  </div>
  <aside use:drag={updateSize}></aside>
</section>

<style>
  section.window {
    position: absolute;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
    background: var(--window);
  }
  .content {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
	.selected {
		border-bottom: 2px solid teal;
		color: #333;
    z-index: 99;
	}
  .maximized {
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: 100% !important;
  }
  header {
    background: var(--window-header);
    color: var(--window-color);
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    cursor: grab;
  }
  section.window.dragging header {
    cursor: grabbing;
  }
  .buttons {
    display: flex;
    align-items: flex-end;
  }
  article {
    overflow: hidden;
  }
  aside {
    position: absolute;
    bottom: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.5);
    width: 1em;
    height: 1em;
    cursor: nwse-resize
  }
  .modal__blocker {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
  }
  .modal {
    overflow: auto;
    position: absolute;
    left: 25%;
    top: 25%;
    width: 50%;
    height: 50%;
    box-shadow: 0 0 0.2em 0.1em #000;
  }
</style>

