import React from 'react';

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
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-bark-faint px-8 whitespace-nowrap">
          {item}
        </span>
        <span className="w-1 h-1 rounded-full bg-clay-500/40 shrink-0" />
      </React.Fragment>
    ))}
  </div>
);

/**
 * A quiet ticker rule between the hero and the body of the page - the real
 * technologies the protocol runs on, set in small mono caps, moving slowly
 * enough to read as a horizon line rather than an animation.
 */
const TechMarquee = () => {
  return (
    <div className="border-y border-line bg-paper overflow-hidden">
      <div className="max-w-6xl mx-auto column-frame py-5 overflow-hidden">
        <div className="flex w-max animate-marquee">
          <Strip />
          <Strip />
        </div>
      </div>
    </div>
  );
};

export default TechMarquee;
