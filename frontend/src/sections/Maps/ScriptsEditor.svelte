<script lang='ts'>

  export let script: string
</script>

<div>
  <textarea>{script}</textarea>
</div>

<style>
  div {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
</style>