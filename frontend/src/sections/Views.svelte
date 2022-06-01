<script lang='ts'>
  import List from "./Maps/List.svelte"
  import Windows from "./Maps/Windows.svelte"

</script>

<div>
  <List></List>
  <Windows></Windows>
</div>

<style>
  div {
    position: relative;
    background: var(--content);
    overflow: hidden;
  }
</style>