<script lang='ts'>
  import { animations as animationsStore } from '../stores/animations'

  export let anim: string = ''
  export let face: string = 'default'
</script>

<span>
  {#await animationsStore.getImage(anim, face)}
    ...
  {:then bytes}
    <img src="data:image/png;base64,{bytes}">
  {:catch error}
    {error}
  {/await}
</span>


<style>
</style>