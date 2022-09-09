<script lang='ts'>
  import { createEventDispatcher } from 'svelte'

  export let type: undefined|'textarea'|'number'|'list'|'checkbox' = undefined
  export let key: string
  export let disabled: boolean = false
  export let clonedDD: any
  export let compiledDD: any

  export let min: string|number = ''
  export let max: string|number = ''
  export let step: string|number = ''

  export let list: any = []

  export let label: string = ''

  let localLabel: string
  $: localLabel = label || key.split('.').concat().pop().replace(/([A-Z])/g, ' $1').trim()

  const dispatch = createEventDispatcher()

  function change(e: Event & { currentTarget: EventTarget & HTMLTextAreaElement|HTMLInputElement|HTMLSelectElement }) {
    let value: any = e.currentTarget.value
    if (type === 'number') {
      value = +value
    }
    clonedDD[key] = value
    dispatch('update')
  }

  function clear() {
    delete clonedDD[key]
    dispatch('update')
  }
</script>

<label>
  <span>{localLabel}</span>
  {#if type === 'textarea'}
    <textarea disabled={disabled} value={clonedDD[key]??''} placeholder={compiledDD[key]} on:change={change}/>
  {:else if type === 'list'}
    <select disabled={disabled} name="Type" value={clonedDD[key]??compiledDD[key]} on:change={change}>
      <option value="">Unknown</option>
      {#if Array.isArray(list)}
        {#each list as entry}
          <option value={entry}>{entry}</option>
        {/each}
      {:else}
        {#each Object.entries(list) as [k, g]}
          <optgroup label={k}>
          {#each g as t}
            <option value={t}>{t}</option>
          {/each}
          </optgroup>
        {/each}
      {/if}
    </select>
  {:else if type === 'number'}
    <input disabled={disabled} type='number' value={clonedDD[key]??''} placeholder={compiledDD[key]} min={min} max={max} step={step} on:change={change}/>
  {:else}
    <input disabled={disabled} type={type} value={clonedDD[key]??''} placeholder={compiledDD[key]} on:change={change}/>
  {/if}
  <button disabled={disabled} on:click={clear}>c</button>
</label>

<style>
  label {
    display: grid;
    grid-template-columns: 6em minmax(0, 1fr) auto;
  }
</style>