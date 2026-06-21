import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Cpu, Play, Square, Check, Copy } from 'lucide-react';

const mockLogs = [
  { time: '00:01.042', tag: 'SYSTEM', type: 'info', text: 'Initializing A2A Negotiator swarm v1.0.4' },
  { time: '00:01.218', tag: 'BUYER_AGENT', type: 'buyer', text: 'Set objective: "Acquire high-perf compute node 0x7"' },
  { time: '00:01.219', tag: 'BUYER_AGENT', type: 'buyer', text: 'Budget constraint set: Max 1000.00 USDC, SLA >99.9% uptime' },
  { time: '00:01.890', tag: 'NETWORK', type: 'info', text: 'Scanning Stellar network for qualified seller counterparties...' },
  { time: '00:02.140', tag: 'NETWORK', type: 'info', text: 'Matched: SELLER_AGENT_09 (Reputation Score: 0.992)' },
  { time: '00:02.321', tag: 'BUYER_AGENT', type: 'buyer', text: 'PROPOSAL sent: bid=800.00 USDC, duration=30d' },
  { time: '00:03.050', tag: 'SELLER_AGENT', type: 'seller', text: 'COUNTER-PROPOSAL: ask=1200.00 USDC. Reason: High load peak overhead' },
  { time: '00:03.980', tag: 'BUYER_AGENT', type: 'buyer', text: 'Delta evaluation: +50% budget overload. Renegotiating parameters...' },
  { time: '00:04.210', tag: 'BUYER_AGENT', type: 'buyer', text: 'COUNTER-PROPOSAL: bid=950.00 USDC, duration=30d, max_latency=50ms' },
  { time: '00:05.110', tag: 'SELLER_AGENT', type: 'seller', text: 'Evaluating Pareto frontier... Convergence probability: 98.4%' },
  { time: '00:05.650', tag: 'SELLER_AGENT', type: 'seller', text: 'AGREEMENT REACHED: 950.00 USDC settled on Stellar USDC rail' },
  { time: '00:06.120', tag: 'CONTRACT', type: 'info', text: 'Generating Soroban smart contract escrow parameters...' },
  { time: '00:06.940', tag: 'LEDGER', type: 'success', text: 'DEPLOYED Escrow: CDKOZ25IENHQFRRNTJDXAYAOUSDBPUXLE52UGTNIPWACAMGAMNXMYTQU' },
  { time: '00:07.410', tag: 'SYSTEM', type: 'success', text: '⚡ DEPOSIT CONFIRMED: 950.00 USDC locked in Smart Escrow. Swarm active.' }
];

const rustEscrowCode = `// Soroban Smart Escrow Contract v1.0
#[contractimpl]
impl SorobanEscrow {
    pub fn initialize(
        env: Env,
        buyer: Address,
        seller: Address,
        amount: i128
    ) {
        buyer.require_auth();
        env.storage().instance().set(&DataKey::Buyer, &buyer);
        env.storage().instance().set(&DataKey::Seller, &seller);
        env.storage().instance().set(&DataKey::Amount, &amount);
        env.storage().instance().set(&DataKey::State, &State::Locked);
    }

    pub fn release(env: Env, verifier: Address) {
        verifier.require_auth();
        let seller: Address = env.storage().instance().get(&DataKey::Seller).unwrap();
        let amount: i128 = env.storage().instance().get(&DataKey::Amount).unwrap();
        
        // Transact funds to seller
        token::Client::new(&env, &get_token(&env))
            .transfer(&env.current_contract_address(), &seller, &amount);
            
        env.storage().instance().set(&DataKey::State, &State::Released);
    }
}`;

const ChatDemo = () => {
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [logIndex, setLogIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isRunning) return;

    if (logIndex < mockLogs.length) {
      const delay = logIndex === 0 ? 500 : (mockLogs[logIndex].time.split('.')[1] * 2 + 300);
      const timer = setTimeout(() => {
        setLogs((prev) => [...prev, mockLogs[logIndex]]);
        setLogIndex((prev) => prev + 1);
      }, Math.max(300, delay));
      return () => clearTimeout(timer);
    } else {
      const resetTimer = setTimeout(() => {
        setLogs([]);
        setLogIndex(0);
      }, 6000);
      return () => clearTimeout(resetTimer);
    }
  }, [logIndex, isRunning]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const copyCode = () => {
    navigator.clipboard.writeText(rustEscrowCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-xl bg-[#030303] border border-zinc-900 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] overflow-hidden font-mono select-none">
      {/* Terminal Title Bar */}
      <div className="px-6 py-4 bg-zinc-950/80 border-b border-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
            <Terminal size={10} className="text-zinc-600 animate-pulse" />
            a2a-swarm-protocol ~ main-session
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title={isRunning ? "Pause Swarm Simulation" : "Resume Swarm Simulation"}
          >
            {isRunning ? <Square size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
          </button>
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#06b6d4]" />
        </div>
      </div>

      {/* Terminal Tabs */}
      <div className="flex border-b border-zinc-900/60 bg-zinc-950/30 text-[9px] font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-3 border-r border-zinc-900 transition-all duration-300 ${
            activeTab === 'logs' 
              ? 'bg-black/40 text-cyan-400 border-b-2 border-b-cyan-400 font-black shadow-[inset_0_-10px_20px_rgba(34,211,238,0.02)]' 
              : 'text-zinc-500 hover:bg-zinc-900/10 hover:text-zinc-300'
          }`}
        >
          Bargain Logs
        </button>
        <button
          onClick={() => setActiveTab('escrow')}
          className={`flex-1 py-3 border-r border-zinc-900 transition-all duration-300 ${
            activeTab === 'escrow' 
              ? 'bg-black/40 text-indigo-400 border-b-2 border-b-indigo-500 font-black shadow-[inset_0_-10px_20px_rgba(99,102,241,0.02)]' 
              : 'text-zinc-500 hover:bg-zinc-900/10 hover:text-zinc-300'
          }`}
        >
          Smart Escrow (Rust)
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex-1 py-3 transition-all duration-300 ${
            activeTab === 'telemetry' 
              ? 'bg-black/40 text-purple-400 border-b-2 border-b-purple-500 font-black shadow-[inset_0_-10px_20px_rgba(168,85,247,0.02)]' 
              : 'text-zinc-500 hover:bg-zinc-900/10 hover:text-zinc-300'
          }`}
        >
          State Telemetry
        </button>
      </div>

      {/* Terminal Body */}
      <div className="p-6 h-[380px] overflow-y-auto bg-black/40 text-xs leading-relaxed" ref={scrollRef}>
        {activeTab === 'logs' && (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="hover:bg-zinc-900/35 p-1.5 px-2 rounded transition-all font-mono text-[11px] leading-relaxed text-zinc-300 select-text">
                <span className="text-zinc-600 select-none mr-2 font-semibold">[{log.time}]</span>
                <span className={`font-bold mr-2 uppercase tracking-wider ${
                  log.type === 'buyer' ? 'text-cyan-400' :
                  log.type === 'seller' ? 'text-purple-400' :
                  log.type === 'success' ? 'text-green-400' : 'text-indigo-400'
                }`}>
                  {log.tag}:
                </span>
                <span className={log.type === 'success' ? 'text-green-300 font-bold' : 'text-zinc-300 font-medium'}>
                  {log.text}
                </span>
              </div>
            ))}
            {isRunning && logIndex < mockLogs.length && (
              <div className="flex gap-1.5 items-center text-zinc-500 italic text-[11px] animate-pulse pl-1">
                <span>Negotiating core parameters</span>
                <span className="w-1 h-1 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1 h-1 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-1 h-1 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'escrow' && (
          <div className="relative group">
            <button
              onClick={copyCode}
              className="absolute top-0 right-0 p-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold"
            >
              {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <pre className="text-zinc-400 overflow-x-auto text-[11px] leading-relaxed no-scrollbar select-text selection:bg-indigo-500/30 selection:text-white">
              {rustEscrowCode}
            </pre>
          </div>
        )}

        {activeTab === 'telemetry' && (
          <div className="space-y-6 select-text selection:bg-purple-500/20">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-900">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Target Object</div>
                <div className="text-sm text-zinc-200 font-bold flex items-center gap-2">
                  <Cpu size={14} className="text-cyan-400" />
                  Cluster_Node_0x7
                </div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-900">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Escrow Finality</div>
                <div className="text-sm text-green-400 font-bold flex items-center gap-2">
                  <Shield size={14} className="text-green-400" />
                  Soroban On-Chain
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-zinc-950/40 border border-zinc-900/50">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Pareto Optimization Target:</span>
                <span className="text-zinc-300 font-bold">Uptime & Cost Bounds</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Buyer Reservation Price:</span>
                <span className="text-zinc-300 font-bold">1000.00 USDC max</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Seller Minimum Acceptable:</span>
                <span className="text-zinc-300 font-bold">900.00 USDC min</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">Settled Transaction Price:</span>
                <span className="text-cyan-400 font-bold font-mono">950.00 USDC</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full w-[95%]" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-zinc-500 bg-zinc-950/80 p-3 rounded-lg border border-zinc-900/40">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>Consensus reached in 4 negotiation rounds (Total Delta convergence rate: 98.4%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-900/60 flex items-center justify-between text-[9px] text-zinc-500 font-bold tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <span>Stellar Testnet Seq:</span>
          <span className="text-cyan-400 font-mono">#51980</span>
        </div>
        <div className="flex gap-4">
          <span>Gas Limit: <span className="text-zinc-400 font-mono">0.0001 XLM</span></span>
          <span>Status: <span className="text-green-400">Stable</span></span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatDemo);
