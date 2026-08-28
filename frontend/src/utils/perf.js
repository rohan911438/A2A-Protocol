/**
 * Should this client skip the heavier motion effects (smooth scroll,
 * custom cursor, per-section pointer glows)?
 *
 * App.jsx runs the same heuristic and writes `data-perf="low"` on <html>,
 * but React runs child effects *before* parent effects, so a component
 * lower in the tree can't rely on that attribute being set yet on the
 * first pass. This re-checks the underlying signals directly so each
 * motion feature can gate itself independently and correctly on mount.
 */
export function prefersLowMotion() {
  if (typeof window === 'undefined') return true;

  const attr = document.documentElement.getAttribute('data-perf');
  if (attr === 'low') return true;

  const prefersReduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return true;

  const cores = navigator.hardwareConcurrency || 8;
  const memory = navigator.deviceMemory || 8;
  return cores <= 4 || memory <= 4;
}
