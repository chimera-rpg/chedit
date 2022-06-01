<script lang="ts">
  import { group_outros } from 'svelte/internal';
  import { maps } from '../../stores/maps'

  let dragging: boolean = false

  function setPosition(event: MouseEvent) {
    console.log('okay, moving', event)
  }

  function drag(node: HTMLElement, callback: any) {
		const onmousedown = (event: MouseEvent) => {
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

</script>

<div>
  {#each $maps.maps as group}
    <section style="left: {group.x}px; top: {group.y}px; width: {group.w}px; height: {group.h}px">
      <header use:drag={setPosition}>
        <span>{group.Path.split('/').reverse()[0]}</span>
        <nav>
          {#each Object.entries(group.Maps) as [key, map]}
            <li>{key}</li>
          {/each}
        </nav>
      </header>
      <article>MAP HERE</article>
    </section>
  {/each}
</div>

<style>
  div {
    display: flex;
    align-items: flex-start;
    flex-wrap: nowrap;
  }
  li {
    padding: 0; margin: 0;
    list-style: none;
  }

  section {
    position: absolute;
    border: 1px solid var(--section-color);
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    background: var(--section);
  }
  header {
    background: var(--subsection);
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto;
  }
  nav {
    background: var(--subsection);
    border-top: 1px solid var(--subsection-color);
    border-bottom: 1px solid var(--subsection-color);
  }
</style>