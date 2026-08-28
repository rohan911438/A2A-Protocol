import React, { useEffect, useState } from 'react';

const points = [
  { id: 'top', label: 'Top' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'features', label: 'Capabilities' },
  { id: 'developer-sdk', label: 'Developers' },
];

/**
 * A slim navigation rail pinned to the right edge on large screens: one dot
 * per home-page section, the current one filled and enlarged, a label on
 * hover. Clicking a dot glides there (through Lenis when it's active, native
 * smooth-scroll otherwise). Overall page progress is already the top bar -
 * this is about where you are and jumping around.
 */
export default function SectionRail() {
  const [active, setActive] = useState('top');

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    points.slice(1).forEach((p) => {
      const el = document.getElementById(p.id);
      if (el) obs.observe(el);
    });
    const onScroll = () => {
      if (window.scrollY < 240) setActive('top');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      obs.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const go = (id) => {
    if (id === 'top') {
      if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.1 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: -100, duration: 1.1 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-4">
      {points.map((p) => (
        <button
          key={p.id}
          onClick={() => go(p.id)}
          aria-label={`Jump to ${p.label}`}
          aria-current={active === p.id ? 'true' : undefined}
          className="group relative flex h-3 w-3 items-center justify-center"
        >
          <span
            className={`rounded-full transition-all duration-300 ${
              active === p.id
                ? 'h-2.5 w-2.5 bg-clay-400 shadow-[0_0_10px_rgba(179,234,30,0.6)]'
                : 'h-1.5 w-1.5 bg-bark-faint group-hover:bg-bark'
            }`}
          />
          <span className="pointer-events-none absolute right-6 whitespace-nowrap rounded-md bg-surface/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-bark-muted opacity-0 translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
            {p.label}
          </span>
        </button>
      ))}
    </div>
  );
}
