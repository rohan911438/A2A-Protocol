import React, { useState } from 'react';
import { Terminal as TerminalIcon, Copy, Check, Code, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const jsCode = `import { AgentNode, StellarRails } from '@a2a/protocol';

// Initialize agent with custom negotiation parameters
const buyerAgent = new AgentNode({
  role: 'buyer',
  budget: 950, // USDC
  objective: 'Acquire high-perf compute cluster 0x7',
  network: StellarRails.TESTNET
});

// Run Pareto negotiation & deploy Soroban escrow
const escrowResult = await buyerAgent.negotiateAndSettle();
console.log(\`Smart Escrow address deployed: \${escrowResult.address}\`);`;

const pyCode = `from a2a_protocol import AgentNode, StellarRails

# Initialize agent with custom negotiation parameters
buyer_agent = AgentNode(
    role='buyer',
    budget=950, # USDC
    objective='Acquire high-perf compute cluster 0x7',
    network=StellarRails.TESTNET
)

# Run Pareto negotiation & deploy Soroban escrow
escrow_result = buyer_agent.negotiate_and_settle()
print(f"Smart Escrow address deployed: {escrow_result.address}")`;

const cliCode = `# Install the global CLI node module
npm install -g @a2a/protocol-cli

# Spin up buyer agent negotiating for compute resources
a2a run --role buyer --budget 950 --objective "Acquire compute cluster 0x7"`;

const renderJSCode = () => (
  <code className="text-zinc-400 font-mono text-[11px] leading-relaxed select-text">
    <span className="text-[#a855f7]">import</span> {"{"} <span className="text-[#22d3ee]">AgentNode</span>, <span className="text-[#22d3ee]">StellarRails</span> {"}"} <span className="text-[#a855f7]">from</span> <span className="text-[#6366f1]">'@a2a/protocol'</span>;<br /><br />
    <span className="text-zinc-600 italic">// Initialize agent with custom negotiation parameters</span><br />
    <span className="text-[#a855f7]">const</span> <span className="text-white">buyerAgent</span> = <span className="text-[#a855f7]">new</span> <span className="text-[#22d3ee]">AgentNode</span>({"{"}<br />
    {"  "}role: <span className="text-[#6366f1]">'buyer'</span>,<br />
    {"  "}budget: <span className="text-cyan-300">950</span>, <span className="text-zinc-600 italic">// USDC</span><br />
    {"  "}objective: <span className="text-[#6366f1]">'Acquire high-perf compute cluster 0x7'</span>,<br />
    {"  "}network: <span className="text-white">StellarRails</span>.<span className="text-cyan-300">TESTNET</span><br />
    {"}"});<br /><br />
    <span className="text-zinc-600 italic">// Run Pareto negotiation & deploy Soroban escrow</span><br />
    <span className="text-[#a855f7]">const</span> <span className="text-white">escrowResult</span> = <span className="text-[#a855f7]">await</span> <span className="text-white">buyerAgent</span>.<span className="text-cyan-350 font-semibold text-cyan-300">negotiateAndSettle</span>();<br />
    <span className="text-white">console</span>.<span className="text-cyan-350 text-cyan-300">log</span>(<span className="text-[#6366f1]">{"`Smart Escrow address deployed: ${"}</span><span className="text-white">escrowResult.address</span><span className="text-[#6366f1]">{"}`"}</span>);
  </code>
);

const renderPyCode = () => (
  <code className="text-zinc-400 font-mono text-[11px] leading-relaxed select-text">
    <span className="text-[#a855f7]">from</span> <span className="text-white">a2a_protocol</span> <span className="text-[#a855f7]">import</span> <span className="text-[#22d3ee]">AgentNode</span>, <span className="text-[#22d3ee]">StellarRails</span><br /><br />
    <span className="text-zinc-600 italic"># Initialize agent with custom negotiation parameters</span><br />
    <span className="text-white">buyer_agent</span> = <span className="text-[#22d3ee]">AgentNode</span>(<br />
    {"    "}role=<span className="text-[#6366f1]">'buyer'</span>,<br />
    {"    "}budget=<span className="text-cyan-300">950</span>, <span className="text-zinc-600 italic"># USDC</span><br />
    {"    "}objective=<span className="text-[#6366f1]">'Acquire high-perf compute cluster 0x7'</span>,<br />
    {"    "}network=<span className="text-white">StellarRails</span>.<span className="text-cyan-300">TESTNET</span><br />
    )<br /><br />
    <span className="text-zinc-600 italic"># Run Pareto negotiation & deploy Soroban escrow</span><br />
    <span className="text-white">escrow_result</span> = <span className="text-white">buyer_agent</span>.<span className="text-cyan-350 font-semibold text-cyan-300">negotiate_and_settle</span>()<br />
    <span className="text-cyan-300">print</span>(<span className="text-[#6366f1]">{"f\"Smart Escrow address deployed: {"}</span><span className="text-white">escrow_result.address</span><span className="text-[#6366f1]">{"}\""}</span>)
  </code>
);

const renderCLICode = () => (
  <code className="text-zinc-400 font-mono text-[11px] leading-relaxed select-text">
    <span className="text-zinc-600 italic"># Install the global CLI node module</span><br />
    <span className="text-cyan-300">npm</span> install -g @a2a/protocol-cli<br /><br />
    <span className="text-zinc-600 italic"># Spin up buyer agent negotiating for compute resources</span><br />
    <span className="text-cyan-300">a2a</span> run --role buyer --budget <span className="text-white">950</span> --objective <span className="text-[#6366f1]">"Acquire compute cluster 0x7"</span>
  </code>
);

const DevSDK = () => {
  const [activeTab, setActiveTab] = useState('js');
  const [copied, setCopied] = useState(false);

  const getCode = () => {
    if (activeTab === 'js') return jsCode;
    if (activeTab === 'py') return pyCode;
    return cliCode;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developer-sdk" className="py-36 px-6 relative overflow-hidden bg-black border-t border-white/5">
      {/* Glow highlight */}
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none -z-10 animate-neural-pulse" />

      <div className="max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Block - Text (Grid Column 5) */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5 space-y-8"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-950/80 border border-white/5 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">
              Developer SDK Interface
            </div>
            <h2 className="text-4xl lg:text-[4rem] font-display font-black text-white leading-none uppercase tracking-tight">
              Deploy An <br />
              Agent In <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Seconds</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-body font-medium opacity-80">
              Integrate agentic economics directly into your server workflows. Leverage the A2A SDK to spawn autonomous agents that negotiate terms, deploy secure Stellar escrows, and complete payouts programmatically.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-400/5 border border-cyan-400/25 flex items-center justify-center text-cyan-400">
                  <ShieldCheck size={11} />
                </div>
                <span className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider">Soroban Smart escrow generation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-400/5 border border-indigo-400/25 flex items-center justify-center text-indigo-400">
                  <ShieldCheck size={11} />
                </div>
                <span className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider">Automated multi-sig signer rails</span>
              </div>
            </div>
          </motion.div>

          {/* Right Block - Code Terminal (Grid Column 7) */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 w-full"
          >
            <div className="bg-[#000000] border border-white/5 rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.85)] font-mono">
              
              {/* Terminal Title */}
              <div className="px-6 py-3.5 bg-zinc-950/80 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Code size={13} className="text-indigo-400" />
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-widest opacity-70">A2A_SDK_INTEGRATION</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 rounded bg-zinc-950 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-[9px] uppercase tracking-wider font-bold"
                >
                  {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              {/* Terminal Tabs */}
              <div className="flex border-b border-white/5 bg-zinc-950/20 text-[9px] font-bold uppercase tracking-widest">
                <button
                  onClick={() => setActiveTab('js')}
                  className={`flex-1 py-3 text-center transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === 'js' ? 'bg-black text-cyan-400 border-b border-b-cyan-500/40 font-bold' : 'text-zinc-550 hover:text-zinc-300'
                  }`}
                >
                  <Code size={11} className="opacity-70" />
                  <span>JavaScript</span>
                </button>
                <button
                  onClick={() => setActiveTab('py')}
                  className={`flex-1 py-3 text-center transition-all border-l border-white/5 flex items-center justify-center gap-2 ${
                    activeTab === 'py' ? 'bg-black text-indigo-400 border-b border-b-indigo-500/40 font-bold' : 'text-zinc-550 hover:text-zinc-300'
                  }`}
                >
                  <Code size={11} className="opacity-70" />
                  <span>Python</span>
                </button>
                <button
                  onClick={() => setActiveTab('cli')}
                  className={`flex-1 py-3 text-center transition-all border-l border-white/5 flex items-center justify-center gap-2 ${
                    activeTab === 'cli' ? 'bg-black text-purple-400 border-b border-b-purple-500/40 font-bold' : 'text-zinc-550 hover:text-zinc-300'
                  }`}
                >
                  <TerminalIcon size={11} className="opacity-70" />
                  <span>CLI</span>
                </button>
              </div>

              {/* Code Panel */}
              <div className="p-6 h-[260px] overflow-y-auto bg-black/50 text-xs">
                <pre className="overflow-x-auto selection:bg-indigo-500/30 selection:text-cyan-400 leading-relaxed no-scrollbar select-text">
                  {activeTab === 'js' && renderJSCode()}
                  {activeTab === 'py' && renderPyCode()}
                  {activeTab === 'cli' && renderCLICode()}
                </pre>
              </div>

              {/* SDK Footer */}
              <div className="px-6 py-3.5 bg-zinc-950/80 border-t border-white/5 flex items-center justify-between text-[9px] text-zinc-650 font-bold uppercase opacity-85">
                <span>npm Registry: @a2a/protocol@1.0.4</span>
                <span className="text-cyan-500 opacity-90">Stellar Mainnet Compatible</span>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default DevSDK;
