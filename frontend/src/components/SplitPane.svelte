<!--
	Taken from the svelte REPL.

Copyright (c) 2019 Rich Harris and contributors

Permission is hereby granted by the authors of this software, to any person, to use the software for any purpose, free of charge, including the rights to run, read, copy, change, distribute and sell it, and including usage rights to any patents the authors may hold on it, subject to the following conditions:

This license, or a link to its text, must be included with all copies of the software and any derivative works.

Any modification to the software submitted to the authors may be incorporated into the software under the terms of this license.

The software is provided "as is", without warranty of any kind, including but not limited to the warranties of title, fitness, merchantability and non-infringement. The authors have no obligation to provide support or updates for the software, and may not be held liable for any damages, claims or other liability arising from its use.
-->
<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let type;
	export let pos = 50;
	export let fixed = false;
	export let min = 50;
	// export let min1 = min;
	// export let min2 = min;

	const refs = {};

	let dragging = false;

	function clamp(num, min, max) {
		return num < min ? min : num > max ? max : num;
	}

	function setPos(event) {
		const { top, bottom, left, right } = refs.container.getBoundingClientRect();

		const extents = type === 'vertical' ? [top, bottom] : [left, right];

		const px = clamp(
			type === 'vertical' ? event.clientY : event.clientX,
			extents[0] + min,
			extents[1] - min
		);

		pos = 100 * (px - extents[0]) / (extents[1] - extents[0]);

		dispatch('change');
	}

	function drag(node, callback) {
		const onmousedown = event => {
			if (event.which !== 1) return;

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

	$: side = type === 'horizontal' ? 'left' : 'top';
	$: dimension = type === 'horizontal' ? 'width' : 'height';
</script>

<style>
	.container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.pane {
		position: relative;
		float: left;
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr);
	}

	.mousecatcher {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background: rgba(255,255,255,.01);
	}

	.divider {
		position: absolute;
		z-index: 10;
		display: none;
	}

	.divider::after {
		content: '';
		position: absolute;
		/* background-color: #eee; */
		background-color: var(--neutral-darkest);
	}

	.horizontal {
		padding: 0 3px;
		width: 0;
		height: 100%;
		cursor: ew-resize;
	}

	.horizontal::after {
		left: 3px;
		top: 0;
		width: 1px;
		height: 100%;
	}

	.vertical {
		padding: 3px 0;
		width: 100%;
		height: 0;
		cursor: ns-resize;
	}

	.vertical::after {
		top: 3px;
		left: 0;
		width: 100%;
		height: 1px;
	}

	.left, .right, .divider {
		display: block;
	}

	.left, .right {
		height: 100%;
		float: left;
	}

	.top, .bottom {
		position: absolute;
		width: 100%;
	}

	.top { top: 0; }
	.bottom { bottom: 0; }
</style>

<div class="container" bind:this={refs.container}>
	<div class="pane" style="{dimension}: {pos}%;">
		<slot name="a"></slot>
	</div>

	<div class="pane" style="{dimension}: {100 - (pos)}%;">
		<slot name="b"></slot>
	</div>

	{#if !fixed}
		<div class="{type} divider" style="{side}: calc({pos}% - 3px)" use:drag={setPos}></div>
	{/if}
</div>

{#if dragging}
	<div class="mousecatcher"></div>
{/if}