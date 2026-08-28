import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Lock, Key, Cpu, Zap, ShieldCheck } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import SpotlightCard from './SpotlightCard';
import RevealHeading from './RevealHeading';
import PointerGlow from './PointerGlow';

const Features = () => {
  const [chartProgress, setChartProgress] = useState(0);
  const [escrowLocked, setEscrowLocked] = useState(true);
  const [x402Success, setX402Success] = useState(false);
  const [activeNode, setActiveNode] = useState(0);

  // The whole bento grid drifts a little against scroll so it reads as a
  // layer floating in front of the heading rather than pinned to it.
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const gridY = useTransform(scrollYProgress, [0, 1], [34, -34]);

  useEffect(() => {
    const chartInterval = setInterval(() => {
      setChartProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 60);

    const nodeInterval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % 4);
    }, 1500);

    return () => {
      clearInterval(chartInterval);
      clearInterval(nodeInterval);
    };
  }, []);

  const getChartPoints = (progress) => {
    const steps = 20;
    const currentStep = Math.floor((progress / 100) * steps);

    let buyerPoints = [];
    let sellerPoints = [];

    for (let i = 0; i <= currentStep; i++) {
      const x = (i / steps) * 200 + 10;
      const bY = 90 - (40 * (i / steps)) - Math.sin(i * 0.5) * 5 * (1 - i / steps);
      const sY = 10 + (40 * (i / steps)) + Math.sin(i * 0.5) * 5 * (1 - i / steps);
      buyerPoints.push(`${x},${bY}`);
      sellerPoints.push(`${x},${sY}`);
    }

    return { buyer: buyerPoints.join(' '), seller: sellerPoints.join(' ') };
  };

  const points = getChartPoints(chartProgress);

  return (
    <section ref={sectionRef} id="features" className="py-28 px-6 relative bg-paper-soft border-t border-line overflow-hidden">
      <PointerGlow color="rgba(94,240,214,0.08)" />
      <div className="max-w-6xl mx-auto space-y-16 relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl space-y-4"
        >
          <div className="text-xs font-semibold text-clay-400 uppercase tracking-[0.2em]">Capabilities</div>
          <RevealHeading
            accent
            text="Everything a trustless agent economy needs"
            className="text-4xl lg:text-5xl font-serif font-medium text-bark leading-tight"
          />
        </motion.div>

        <motion.div style={{ y: gridY }} className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Card 1: Pareto Bargaining */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="md:col-span-7"
          >
          <SpotlightCard className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center h-full">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-clay-500/10 border border-clay-500/20 text-clay-400 flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <h3 className="text-lg font-semibold text-bark">
                  Pareto bargaining
                </h3>
                <p className="text-sm text-bark-muted leading-relaxed">
                  Buyer and seller agents run sub-second, game-theoretic negotiation, iterating until they reach Pareto-efficient terms.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-raised border border-line h-[180px] flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-center text-[9px] text-bark-faint font-mono uppercase tracking-wider">
                  <span>Price resolution</span>
                  <span className="text-moss-400 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-moss-400" />
                    Round 4 converged
                  </span>
                </div>

                <div className="flex-1 w-full relative mt-2">
                  <svg className="w-full h-full" viewBox="0 0 220 100" preserveAspectRatio="none">
                    <line x1="10" y1="50" x2="210" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
                    <line x1="110" y1="10" x2="110" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />

                    {points.buyer && (
                      <polyline fill="none" stroke="#B3EA1E" strokeWidth="1.75" points={points.buyer} />
                    )}
                    {points.seller && (
                      <polyline fill="none" stroke="#5EF0D6" strokeWidth="1.75" points={points.seller} />
                    )}

                    {chartProgress > 95 && (
                      <circle cx="210" cy="50" r="3" fill="#B3EA1E" />
                    )}
                  </svg>
                </div>

                <div className="flex justify-between text-[10px] text-bark-faint font-mono mt-1">
                  <span>Bid $800 / Ask $1200</span>
                  <span className="text-clay-400 font-bold">$950.00</span>
                </div>
              </div>
            </div>
          </SpotlightCard>
          </motion.div>

          {/* Card 2: Soroban Smart Escrow */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-5"
          >
          <SpotlightCard className="p-8 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-clay-500/10 border border-clay-500/20 text-clay-400 flex items-center justify-center">
                <Lock size={18} />
              </div>
              <h3 className="text-lg font-semibold text-bark">
                Soroban smart escrow
              </h3>
              <p className="text-sm text-bark-muted leading-relaxed">
                Every agreement deploys its own escrow contract on Stellar. Funds are held immutably and only released on verified proof-of-work.
              </p>
            </div>

            <div
              onClick={() => setEscrowLocked(!escrowLocked)}
              className="mt-8 p-4 rounded-xl bg-surface-raised border border-line flex items-center justify-between cursor-pointer hover:border-clay-500/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  escrowLocked ? 'bg-white/5 text-bark-faint' : 'bg-clay-500 text-black'
                }`}>
                  <Key size={13} className={escrowLocked ? 'rotate-0' : 'rotate-45 transition-transform'} />
                </div>
                <div>
                  <div className="text-[10px] text-bark-faint uppercase tracking-widest font-semibold">Contract state</div>
                  <div className="text-xs text-bark font-bold font-mono">{escrowLocked ? 'LOCKED_ESCROW' : 'RELEASED_SETTLED'}</div>
                </div>
              </div>
              <span className={`text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border ${
                escrowLocked ? 'bg-clay-500/10 border-clay-500/25 text-clay-400' : 'bg-moss-400/10 border-moss-400/30 text-moss-400'
              }`}>
                {escrowLocked ? 'Locked' : 'Released'}
              </span>
            </div>
          </SpotlightCard>
          </motion.div>

          {/* Card 3: x402 Micropayments */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="md:col-span-5"
          >
          <SpotlightCard className="p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-clay-500/10 border border-clay-500/20 text-clay-400 flex items-center justify-center">
                <Zap size={18} />
              </div>
              <h3 className="text-lg font-semibold text-bark">
                x402 payment gating
              </h3>
              <p className="text-sm text-bark-muted leading-relaxed">
                Secure access tokens gate critical agent actions — requests require a confirmed micropayment before secret payloads are returned.
              </p>
            </div>

            <div
              onMouseEnter={() => setX402Success(true)}
              onMouseLeave={() => setX402Success(false)}
              className="mt-8 p-4 rounded-xl bg-black font-mono text-[10px] leading-relaxed relative overflow-hidden h-[110px] border border-line"
            >
              {!x402Success ? (
                <div className="space-y-1.5 text-zinc-500">
                  <div className="text-clay-400 font-bold">HTTP/1.1 402 Payment Required</div>
                  <div>X-Agent-Gate: x402-gated-token</div>
                  <div>Status: <span className="text-clay-400 font-bold">LOCKED_PAYLOAD</span></div>
                  <div className="text-[9px] text-zinc-600 mt-2 italic">Hover to unlock secure payload...</div>
                </div>
              ) : (
                <div className="space-y-1.5 text-moss-400 animate-fadeInUp">
                  <div className="font-bold text-moss-400">HTTP/1.1 200 OK [DECRYPTED]</div>
                  <div className="text-zinc-300">Payload: {"{ secret_token: \"soroban_auth_0x4f\" }"}</div>
                  <div className="text-moss-400 font-bold">X-Payment-Settled: verified</div>
                  <div className="text-[9px] text-moss-400/80 mt-2 flex items-center gap-1">
                    <ShieldCheck size={10} />
                    Valid cryptographic proof
                  </div>
                </div>
              )}
            </div>
          </SpotlightCard>
          </motion.div>

          {/* Card 4: Swarm Multi-Agent Verification */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-7"
          >
          <SpotlightCard className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center h-full">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-clay-500/10 border border-clay-500/20 text-clay-400 flex items-center justify-center">
                  <Cpu size={18} />
                </div>
                <h3 className="text-lg font-semibold text-bark">
                  Multi-agent verification
                </h3>
                <p className="text-sm text-bark-muted leading-relaxed">
                  A distributed network of verifier agents validates completed deliverables on-chain, acting as cryptographic arbiters for escrow releases.
                </p>
              </div>

              <div className="relative h-[150px] bg-surface-raised rounded-xl border border-line flex items-center justify-center overflow-hidden">
                <svg className="absolute inset-0 w-full h-full opacity-70" viewBox="0 0 200 120">
                  <line x1="40" y1="30" x2="160" y2="30" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <line x1="40" y1="30" x2="40" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <line x1="160" y1="30" x2="160" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <line x1="40" y1="90" x2="160" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <line x1="40" y1="30" x2="160" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                  {activeNode === 0 && <line x1="40" y1="30" x2="160" y2="30" stroke="#B3EA1E" strokeWidth="1.5" />}
                  {activeNode === 1 && <line x1="160" y1="30" x2="160" y2="90" stroke="#93C914" strokeWidth="1.5" />}
                  {activeNode === 2 && <line x1="160" y1="90" x2="40" y2="90" stroke="#5EF0D6" strokeWidth="1.5" />}
                  {activeNode === 3 && <line x1="40" y1="90" x2="40" y2="30" stroke="#B3EA1E" strokeWidth="1.5" />}

                  {activeNode === 0 && (
                    <circle r="2" fill="#B3EA1E">
                      <animate attributeName="cx" from="40" to="160" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="cy" from="30" to="30" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {activeNode === 1 && (
                    <circle r="2" fill="#93C914">
                      <animate attributeName="cx" from="160" to="160" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="cy" from="30" to="90" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {activeNode === 2 && (
                    <circle r="2" fill="#5EF0D6">
                      <animate attributeName="cx" from="160" to="40" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="cy" from="90" to="90" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {activeNode === 3 && (
                    <circle r="2" fill="#B3EA1E">
                      <animate attributeName="cx" from="40" to="40" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="cy" from="90" to="30" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                </svg>

                {[
                  { pos: 'top-[20px] left-[30px]', label: 'Buyer', code: 'B', idx: 0 },
                  { pos: 'top-[20px] right-[30px]', label: 'Seller', code: 'S', idx: 1 },
                  { pos: 'bottom-[20px] right-[30px]', label: 'Verifier', code: 'V', idx: 2 },
                  { pos: 'bottom-[20px] left-[30px]', label: 'Escrow', code: 'E', idx: 3 },
                ].map((node) => (
                  <div key={node.code} className={`absolute ${node.pos} flex flex-col items-center`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all duration-300 ${
                      activeNode === node.idx ? 'bg-clay-500 text-black' : 'bg-white/5 text-bark-faint'
                    }`}>
                      {node.code}
                    </div>
                    <span className="text-[7px] font-mono text-bark-faint mt-1 uppercase font-bold">{node.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};

export default Features;
