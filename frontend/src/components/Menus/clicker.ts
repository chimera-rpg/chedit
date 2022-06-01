export function clickOutside(node: Element) {
  const onClick = (e: MouseEvent) => {
    if (e.target instanceof Element && !node.contains(e.target)) {
      node.dispatchEvent(new CustomEvent("outclick"))
    }
  }

  document.addEventListener('click', onClick, true)

  return {
    destroy() {
      document.removeEventListener('click', onClick, true)
    }
  }
}