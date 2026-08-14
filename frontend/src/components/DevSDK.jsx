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
    <span className="text-[#E2916F]">import</span> {"{"} <span className="text-[#E8A98A]">AgentNode</span>, <span className="text-[#E8A98A]">StellarRails</span> {"}"} <span className="text-[#E2916F]">from</span> <span className="text-[#8A9A7E]">'@a2a/protocol'</span>;<br /><br />
    <span className="text-zinc-600 italic">// Initialize agent with custom negotiation parameters</span><br />
    <span className="text-[#E2916F]">const</span> <span className="text-white">buyerAgent</span> = <span className="text-[#E2916F]">new</span> <span className="text-[#E8A98A]">AgentNode</span>({"{"}<br />
    {"  "}role: <span className="text-[#8A9A7E]">'buyer'</span>,<br />
    {"  "}budget: <span className="text-[#E8A98A]">950</span>, <span className="text-zinc-600 italic">// USDC</span><br />
    {"  "}objective: <span className="text-[#8A9A7E]">'Acquire high-perf compute cluster 0x7'</span>,<br />
    {"  "}network: <span className="text-white">StellarRails</span>.<span className="text-[#E8A98A]">TESTNET</span><br />
    {"}"});<br /><br />
    <span className="text-zinc-600 italic">// Run Pareto negotiation & deploy Soroban escrow</span><br />
    <span className="text-[#E2916F]">const</span> <span className="text-white">escrowResult</span> = <span className="text-[#E2916F]">await</span> <span className="text-white">buyerAgent</span>.<span className="font-semibold text-[#E8A98A]">negotiateAndSettle</span>();<br />
    <span className="text-white">console</span>.<span className="text-[#E8A98A]">log</span>(<span className="text-[#8A9A7E]">{"`Smart Escrow address deployed: ${"}</span><span className="text-white">escrowResult.address</span><span className="text-[#8A9A7E]">{"}`"}</span>);
  </code>
);

const renderPyCode = () => (
  <code className="text-zinc-400 font-mono text-[11px] leading-relaxed select-text">
    <span className="text-[#E2916F]">from</span> <span className="text-white">a2a_protocol</span> <span className="text-[#E2916F]">import</span> <span className="text-[#E8A98A]">AgentNode</span>, <span className="text-[#E8A98A]">StellarRails</span><br /><br />
    <span className="text-zinc-600 italic"># Initialize agent with custom negotiation parameters</span><br />
    <span className="text-white">buyer_agent</span> = <span className="text-[#E8A98A]">AgentNode</span>(<br />
    {"    "}role=<span className="text-[#8A9A7E]">'buyer'</span>,<br />
    {"    "}budget=<span className="text-[#E8A98A]">950</span>, <span className="text-zinc-600 italic"># USDC</span><br />
    {"    "}objective=<span className="text-[#8A9A7E]">'Acquire high-perf compute cluster 0x7'</span>,<br />
    {"    "}network=<span className="text-white">StellarRails</span>.<span className="text-[#E8A98A]">TESTNET</span><br />
    )<br /><br />
    <span className="text-zinc-600 italic"># Run Pareto negotiation & deploy Soroban escrow</span><br />
    <span className="text-white">escrow_result</span> = <span className="text-white">buyer_agent</span>.<span className="font-semibold text-[#E8A98A]">negotiate_and_settle</span>()<br />
    <span className="text-[#E8A98A]">print</span>(<span className="text-[#8A9A7E]">{"f\"Smart Escrow address deployed: {"}</span><span className="text-white">escrow_result.address</span><span className="text-[#8A9A7E]">{"}\""}</span>)
  </code>
);

const renderCLICode = () => (
  <code className="text-zinc-400 font-mono text-[11px] leading-relaxed select-text">
    <span className="text-zinc-600 italic"># Install the global CLI node module</span><br />
    <span className="text-[#E8A98A]">npm</span> install -g @a2a/protocol-cli<br /><br />
    <span className="text-zinc-600 italic"># Spin up buyer agent negotiating for compute resources</span><br />
    <span className="text-[#E8A98A]">a2a</span> run --role buyer --budget <span className="text-white">950</span> --objective <span className="text-[#8A9A7E]">"Acquire compute cluster 0x7"</span>
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
    <section id="developer-sdk" className="py-28 px-6 relative bg-paper border-t border-line">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="text-xs font-semibold text-clay-400 uppercase tracking-[0.2em]">Developer SDK</div>
            <h2 className="text-4xl lg:text-5xl font-serif font-medium text-bark leading-tight">
              Deploy an agent in seconds
            </h2>
            <p className="text-base text-bark-muted leading-relaxed">
              Integrate agentic economics directly into your server workflows. Spawn agents that negotiate terms, deploy Stellar escrows, and complete payouts programmatically.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-clay-500/10 border border-clay-500/20 flex items-center justify-center text-clay-400">
                  <ShieldCheck size={11} />
                </div>
                <span className="text-sm text-bark-muted font-medium">Soroban smart escrow generation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-clay-500/10 border border-clay-500/20 flex items-center justify-center text-clay-400">
                  <ShieldCheck size={11} />
                </div>
                <span className="text-sm text-bark-muted font-medium">Automated multi-sig signer rails</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 w-full"
          >
            <div className="bg-bark rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(38,36,31,0.18)] font-mono">

              <div className="px-6 py-3.5 bg-black/20 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Code size={13} className="text-clay-400" />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest opacity-80">A2A SDK Integration</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 rounded bg-white/5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-[9px] uppercase tracking-wider font-bold"
                >
                  {copied ? <Check size={10} className="text-moss-400" /> : <Copy size={10} />}
                  {copied ? 'Copied!' : 'Copy code'}
                </button>
              </div>

              <div className="flex border-b border-white/5 bg-black/10 text-[9px] font-bold uppercase tracking-widest">
                <button
                  onClick={() => setActiveTab('js')}
                  className={`flex-1 py-3 text-center transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === 'js' ? 'bg-black/30 text-clay-400 border-b border-b-clay-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Code size={11} className="opacity-70" />
                  <span>JavaScript</span>
                </button>
                <button
                  onClick={() => setActiveTab('py')}
                  className={`flex-1 py-3 text-center transition-all border-l border-white/5 flex items-center justify-center gap-2 ${
                    activeTab === 'py' ? 'bg-black/30 text-clay-400 border-b border-b-clay-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Code size={11} className="opacity-70" />
                  <span>Python</span>
                </button>
                <button
                  onClick={() => setActiveTab('cli')}
                  className={`flex-1 py-3 text-center transition-all border-l border-white/5 flex items-center justify-center gap-2 ${
                    activeTab === 'cli' ? 'bg-black/30 text-clay-400 border-b border-b-clay-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <TerminalIcon size={11} className="opacity-70" />
                  <span>CLI</span>
                </button>
              </div>

              <div className="p-6 h-[260px] overflow-y-auto text-xs">
                <pre className="overflow-x-auto selection:bg-clay-500/30 selection:text-white leading-relaxed no-scrollbar select-text">
                  {activeTab === 'js' && renderJSCode()}
                  {activeTab === 'py' && renderPyCode()}
                  {activeTab === 'cli' && renderCLICode()}
                </pre>
              </div>

              <div className="px-6 py-3.5 bg-black/20 border-t border-white/5 flex items-center justify-between text-[9px] text-zinc-500 font-bold uppercase">
                <span>npm registry: @a2a/protocol@1.0.4</span>
                <span className="text-clay-400/90">Stellar mainnet compatible</span>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default DevSDK;
