import React, { useState, useEffect } from 'react';
import { MessageSquare, Lock, Key, Cpu, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Features = () => {
  // States for interactive widgets
  const [chartProgress, setChartProgress] = useState(0);
  const [escrowLocked, setEscrowLocked] = useState(true);
  const [x402Success, setX402Success] = useState(false);
  const [activeNode, setActiveNode] = useState(0);

  // Auto-run animations
  useEffect(() => {
    // 1. Convergence Chart Loop
    const chartInterval = setInterval(() => {
      setChartProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 60);

    // 2. Swarm node blinking loop
    const nodeInterval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % 4);
    }, 1500);

    return () => {
      clearInterval(chartInterval);
      clearInterval(nodeInterval);
    };
  }, []);

  // Calculate coordinates for converging chart
  const getChartPoints = (progress) => {
    const steps = 20;
    const currentStep = Math.floor((progress / 100) * steps);
    
    let buyerPoints = [];
    let sellerPoints = [];
    
    for (let i = 0; i <= currentStep; i++) {
      const x = (i / steps) * 200 + 10;
      // Convergence curve
      const bY = 90 - (40 * (i / steps)) - Math.sin(i * 0.5) * 5 * (1 - i/steps);
      const sY = 10 + (40 * (i / steps)) + Math.sin(i * 0.5) * 5 * (1 - i/steps);
      buyerPoints.push(`${x},${bY}`);
      sellerPoints.push(`${x},${sY}`);
    }
    
    return { buyer: buyerPoints.join(' '), seller: sellerPoints.join(' ') };
  };

  const points = getChartPoints(chartProgress);

  return (
    <section id="features" className="py-36 px-6 relative overflow-hidden bg-black">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[600px] bg-purple-500/5 blur-[200px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto z-10 relative space-y-24">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-950/80 border border-white/5 text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-400">
            Engine Infrastructure
          </div>
          <h2 className="text-4xl lg:text-[4.5rem] font-display font-black text-white leading-none uppercase tracking-tight">
            Protocol Capabilities
          </h2>
          <p className="text-sm text-slate-400 font-body font-medium max-w-xl mx-auto leading-relaxed opacity-80">
            Every layer of the A2A Protocol is designed for low-latency, trustless autonomous transactions. Explore the core engine capabilities.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Card 1: Pareto Bargaining (Width: 7/12) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="md:col-span-7 bento-card group cursor-default"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center h-full">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 group-hover:border-cyan-400/40 transition-all duration-300">
                  <MessageSquare size={18} />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white">
                  Autonomous Pareto Bargaining
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  AI buyer and seller agents execute sub-second game-theoretic negotiation. They optimize variables iteratively until they reach Pareto-efficient terms.
                </p>
              </div>

              {/* Interactive SVG Chart Widget */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 h-[180px] flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                  <span>SWARM PRICE RESOLUTION</span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                    ROUND 4 CONVERGED
                  </span>
                </div>
                
                <div className="flex-1 w-full relative mt-2">
                  <svg className="w-full h-full" viewBox="0 0 220 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="10" y1="50" x2="210" y2="50" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                    <line x1="110" y1="10" x2="110" y2="90" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                    
                    {/* Buyer Bid Line (Cyan) */}
                    {points.buyer && (
                      <polyline
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="1.5"
                        points={points.buyer}
                      />
                    )}
                    {/* Seller Ask Line (Indigo) */}
                    {points.seller && (
                      <polyline
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="1.5"
                        points={points.seller}
                      />
                    )}

                    {/* Convergence point indicator */}
                    {chartProgress > 95 && (
                      <circle cx="210" cy="50" r="4" fill="#22d3ee" className="animate-ping" />
                    )}
                    {chartProgress > 95 && (
                      <circle cx="210" cy="50" r="2.5" fill="#22d3ee" />
                    )}
                  </svg>
                </div>

                <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-1">
                  <span>Round 0 (Bid: $800 / Ask: $1200)</span>
                  <span className="text-cyan-300 font-bold">$950.00</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Soroban Smart Escrow (Width: 5/12) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="md:col-span-5 bento-card group flex flex-col justify-between h-full cursor-default"
          >
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 group-hover:border-purple-400/40 transition-all duration-300">
                <Lock size={18} />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-tight text-white">
                Soroban Smart Escrow
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Agreements deploy custom escrow contracts on Stellar Testnet. Funds are held immutably and released only on verified proof-of-work.
              </p>
            </div>

            {/* Interactive Lock State Widget */}
            <div 
              onClick={() => setEscrowLocked(!escrowLocked)}
              className="mt-8 p-4 rounded-xl bg-zinc-950/60 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  escrowLocked ? 'bg-zinc-900 text-zinc-400 border border-white/5' : 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                }`}>
                  <Key size={13} className={escrowLocked ? 'rotate-0' : 'rotate-45 transition-transform'} />
                </div>
                <div className="font-mono">
                  <div className="text-[10px] text-zinc-550 uppercase tracking-widest font-bold opacity-60">Smart Contract State</div>
                  <div className="text-xs text-zinc-200 font-bold">{escrowLocked ? 'STATE_LOCKED_ESCROW' : 'STATE_RELEASED_SETTLED'}</div>
                </div>
              </div>
              <span className={`text-[8px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border transition-all duration-300 ${
                escrowLocked ? 'bg-red-500/5 border-red-500/20 text-red-400/90' : 'bg-green-500/5 border-green-500/20 text-green-400 animate-pulse'
              }`}>
                {escrowLocked ? 'Locked' : 'Released'}
              </span>
            </div>
          </motion.div>

          {/* Card 3: x402 Micropayments (Width: 5/12) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="md:col-span-5 bento-card group flex flex-col justify-between h-full cursor-default"
          >
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 group-hover:border-indigo-500/40 transition-all duration-300">
                <Zap size={18} />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-tight text-white">
                x402 Payment Gating
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Secure access tokens gate critical agent actions. Request headers require micropayment confirmation before returning secret payloads.
              </p>
            </div>

            {/* Interactive x402 Payload Decryption Widget */}
            <div 
              onMouseEnter={() => setX402Success(true)}
              onMouseLeave={() => setX402Success(false)}
              className="mt-8 p-4 rounded-xl bg-zinc-950/60 border border-white/5 font-mono text-[10px] leading-relaxed relative overflow-hidden h-[110px] hover:border-white/10 transition-all duration-300"
            >
              {!x402Success ? (
                <div className="space-y-1.5 text-zinc-500">
                  <div className="text-red-400/90 font-bold">HTTP/1.1 402 Payment Required</div>
                  <div>X-Agent-Gate: x402-gated-token</div>
                  <div>Status: <span className="text-red-400/90 font-bold">LOCKED_PAYLOAD</span></div>
                  <div className="text-[9px] text-zinc-650 mt-2 italic opacity-60">Hover to unlock secure payload...</div>
                </div>
              ) : (
                <div className="space-y-1.5 text-green-400 animate-fadeInUp">
                  <div className="font-bold text-green-400">HTTP/1.1 200 OK [DECRYPTED]</div>
                  <div className="text-zinc-300">Payload: {"{ secret_token: \"soroban_auth_0x4f\" }"}</div>
                  <div className="text-green-500 font-bold">X-Payment-Settled: verified</div>
                  <div className="text-[9px] text-green-500/70 mt-2 flex items-center gap-1">
                    <ShieldCheck size={10} />
                    Valid cryptographic proof
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Card 4: Swarm Multi-Agent Verification (Width: 7/12) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="md:col-span-7 bento-card group cursor-default"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center h-full">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 group-hover:border-cyan-400/40 transition-all duration-300">
                  <Cpu size={18} />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white">
                  Swarm Multi-Agent Verifier
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  A distributed network of verifier agents validates completed deliverables on-chain, acting as cryptographic arbiters for escrow releases.
                </p>
              </div>

              {/* Swarm Visualizer Mesh */}
              <div className="relative h-[150px] bg-zinc-950/60 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
                {/* Visual Mesh Lines */}
                <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 200 120">
                  <line x1="40" y1="30" x2="160" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="0.75" />
                  <line x1="40" y1="30" x2="40" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="0.75" />
                  <line x1="160" y1="30" x2="160" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="0.75" />
                  <line x1="40" y1="90" x2="160" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="0.75" />
                  <line x1="40" y1="30" x2="160" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="0.75" />
                  
                  {/* Glowing active node connection paths */}
                  {activeNode === 0 && <line x1="40" y1="30" x2="160" y2="30" stroke="#6366f1" strokeWidth="1.25" className="animate-pulse" />}
                  {activeNode === 1 && <line x1="160" y1="30" x2="160" y2="90" stroke="#a855f7" strokeWidth="1.25" className="animate-pulse" />}
                  {activeNode === 2 && <line x1="160" y1="90" x2="40" y2="90" stroke="#22d3ee" strokeWidth="1.25" className="animate-pulse" />}
                  {activeNode === 3 && <line x1="40" y1="90" x2="40" y2="30" stroke="#6366f1" strokeWidth="1.25" className="animate-pulse" />}
                  
                  {/* Animated packets moving along paths */}
                  {activeNode === 0 && (
                    <circle r="1.5" fill="#6366f1">
                      <animate attributeName="cx" from="40" to="160" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="cy" from="30" to="30" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {activeNode === 1 && (
                    <circle r="1.5" fill="#a855f7">
                      <animate attributeName="cx" from="160" to="160" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="cy" from="30" to="90" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {activeNode === 2 && (
                    <circle r="1.5" fill="#22d3ee">
                      <animate attributeName="cx" from="160" to="40" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="cy" from="90" to="90" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {activeNode === 3 && (
                    <circle r="1.5" fill="#6366f1">
                      <animate attributeName="cx" from="40" to="40" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="cy" from="90" to="30" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                </svg>

                {/* Swarm Nodes */}
                <div className="absolute top-[20px] left-[30px] flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all duration-300 ${
                    activeNode === 0 ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400' : 'bg-zinc-950 text-zinc-500 border border-white/5'
                  }`}>
                    B
                  </div>
                  <span className="text-[7px] font-mono text-zinc-600 mt-1 uppercase font-bold">Buyer</span>
                </div>

                <div className="absolute top-[20px] right-[30px] flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all duration-300 ${
                    activeNode === 1 ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-purple-400' : 'bg-zinc-950 text-zinc-500 border border-white/5'
                  }`}>
                    S
                  </div>
                  <span className="text-[7px] font-mono text-zinc-600 mt-1 uppercase font-bold">Seller</span>
                </div>

                <div className="absolute bottom-[20px] right-[30px] flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all duration-300 ${
                    activeNode === 2 ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)] border border-cyan-400' : 'bg-zinc-950 text-zinc-500 border border-white/5'
                  }`}>
                    V
                  </div>
                  <span className="text-[7px] font-mono text-zinc-600 mt-1 uppercase font-bold">Verifier</span>
                </div>

                <div className="absolute bottom-[20px] left-[30px] flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all duration-300 ${
                    activeNode === 3 ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400' : 'bg-zinc-950 text-zinc-500 border border-white/5'
                  }`}>
                    E
                  </div>
                  <span className="text-[7px] font-mono text-zinc-600 mt-1 uppercase font-bold">Escrow</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Features;
