import React from 'react';
import Reveal from './Reveal';

const items = [
  'Stellar Network',
  'Soroban Smart Contracts',
  'Gemini AI Agents',
  'x402 Micropayments',
  'Pareto-Optimal Negotiation',
  'Testnet Live',
];

const Strip = () => (
  <div className="flex items-center shrink-0" aria-hidden="true">
    {items.map((item) => (
      <React.Fragment key={item}>
        <span className="text-sm font-medium text-bark-faint px-6 whitespace-nowrap">{item}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-clay-500/30 shrink-0" />
      </React.Fragment>
    ))}
  </div>
);

/**
 * Continuous horizontal scroll of the real technologies the protocol runs
 * on - not fabricated stats or logos, just a bit of always-on motion
 * between static sections so the page doesn't feel like it stops moving
 * the moment scroll-reveals finish.
 */
const TechMarquee = () => {
  return (
    <Reveal
      amount={0.6}
      className="py-8 border-t border-line bg-paper-soft overflow-hidden relative"
    >
      {/* Feather both horizontal ends so the strip slides out of a soft edge
          rather than being visibly clipped at the viewport border. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-paper-soft to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-paper-soft to-transparent" />
      <div className="flex w-max animate-marquee">
        <Strip />
        <Strip />
      </div>
    </Reveal>
  );
};

export default TechMarquee;
