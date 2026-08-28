import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

/**
 * App-wide inertial smooth scrolling.
 *
 * Native scroll on a long, layered page (parallax hero, in-view reveals,
 * sticky nav) reads as abrupt - each wheel notch jumps a fixed step. Lenis
 * interpolates that into a short eased glide, which is what makes the page
 * feel "designed" rather than default while scrolling. framer-motion's
 * `useScroll` (progress bar, hero parallax) keeps working because Lenis
 * still emits real `scroll` events.
 *
 * Deliberately inert when the visitor asked for less motion or the device
 * is flagged low-power (`data-perf="low"` is set in App.jsx): in that case
 * we leave the browser's own scrolling untouched.
 *
 * Returns nothing - it also intercepts same-page hash links (`#features`,
 * ...) so the nav anchors glide with the same easing and clear the fixed
 * navbar, and snaps to the top on every route change.
 */
export default function useSmoothScroll() {
  const lenisRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const lowPerf = root.getAttribute('data-perf') === 'low';
    const prefersReduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (lowPerf || prefersReduced) return undefined;

    const lenis = new Lenis({
      duration: 1.05,
      // expo-out: quick to start, long gentle settle - the "premium" curve.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;
    window.__lenis = lenis;

    let frame;
    const raf = (time) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    // Same-page hash links glide instead of jumping, and stop clear of the
    // 80px fixed navbar.
    const onClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -100, duration: 1.2 });
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
      delete window.__lenis;
    };
  }, []);

  // New route => start at the top, regardless of which scroller is active.
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);
}
