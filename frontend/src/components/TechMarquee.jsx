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

// A second pass in a different order so the two rows never line up.
const itemsAlt = [
  'Multi-Agent Verification',
  'Immutable Escrow',
  'Instant Settlement',
  'On-chain Audit Trail',
  'Autonomous Payouts',
  'Trust-minimized',
];

const Strip = ({ list }) => (
  <div className="flex items-center shrink-0" aria-hidden="true">
    {list.map((item) => (
      <React.Fragment key={item}>
        <span className="group flex items-center px-6 whitespace-nowrap">
          <span className="text-sm font-medium text-bark-faint transition-colors duration-300 group-hover:text-bark">
            {item}
          </span>
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-clay-500/30 shrink-0" />
      </React.Fragment>
    ))}
  </div>
);

/**
 * Two continuous rows of the real technologies the protocol runs on,
 * scrolling in opposite directions for a bit of parallax depth - always-on
 * motion between the static sections so the page never feels like it stops
 * moving the moment scroll-reveals finish. Each item warms to full white on
 * hover; hovering either row pauses it.
 */
const TechMarquee = () => {
  return (
    <Reveal
      amount={0.6}
      className="py-7 border-t border-line bg-paper-soft overflow-hidden relative space-y-3"
    >
      {/* feather both horizontal ends */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-paper-soft to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-paper-soft to-transparent" />

      <div className="flex w-max animate-marquee">
        <Strip list={items} />
        <Strip list={items} />
      </div>
      <div className="flex w-max animate-marquee-reverse opacity-60">
        <Strip list={itemsAlt} />
        <Strip list={itemsAlt} />
      </div>
    </Reveal>
  );
};

export default TechMarquee;
