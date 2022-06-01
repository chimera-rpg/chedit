<script lang="ts">
  import { maps } from '../../stores/maps'

</script>

<div>
  {#each $maps.maps as group}
    <li> {group.Path.split('/').reverse()[0]} </li>
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
</style>