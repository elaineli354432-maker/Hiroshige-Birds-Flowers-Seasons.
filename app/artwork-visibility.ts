// One observer for the exhibition, rather than a scroll listener per print.
const pending = new Map<Element, () => void>();
let observer: IntersectionObserver | undefined;

export function whenArtworkNearViewport(element: Element, reveal: () => void) {
  if (typeof IntersectionObserver === 'undefined') {
    reveal();
    return () => {};
  }
  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const callback = pending.get(entry.target);
      pending.delete(entry.target);
      observer?.unobserve(entry.target);
      callback?.();
    }
  }, { rootMargin: '240px 0px' });
  pending.set(element, reveal);
  observer.observe(element);
  return () => {
    pending.delete(element);
    observer?.unobserve(element);
    if (!pending.size) {
      observer?.disconnect();
      observer = undefined;
    }
  };
}
