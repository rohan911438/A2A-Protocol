import React, { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';

const messages = [
  { role: 'buyer', text: "Requesting node authorization for data cluster 0x7. Budget: 800 USDC.", delay: 1000 },
  { role: 'seller', text: "Authorization requires higher compute overhead. Seeking 1200 USDC.", delay: 2000 },
  { role: 'buyer', text: "Adjusting latency requirements. Can we optimize at 950 USDC?", delay: 2500 },
  { role: 'seller', text: "Agreed. Swarm intelligence sync complete. 950 USDC on XLM rail.", delay: 2000 },
  { role: 'system', text: "⚡ PROTOCOL SETTLED at 950 USDC", delay: 1500 }
];

const ChatDemo = () => {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < messages.length) {
      const timer = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, messages[index]]);
        setIndex((prev) => prev + 1);
      }, messages[index].delay);
      return () => clearTimeout(timer);
    } else {
      const resetTimer = setTimeout(() => {
        setVisibleMessages([]);
        setIndex(0);
      }, 5000);
      return () => clearTimeout(resetTimer);
    }
  }, [index]);

  return (
    <div className="w-full max-w-md glass-morphism rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-floaty">
      {/* Chat header */}
      <div className="px-6 py-5 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse-glow shadow-[0_0_10px_#22d3ee]" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Neural Link: Active</span>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-white/5 border border-white/10" />
          <div className="w-2 h-2 rounded-full bg-white/5 border border-white/10" />
          <div className="w-2 h-2 rounded-full bg-indigo-500/50" />
        </div>
      </div>

      {/* Chat messages */}
      <div className="p-8 h-[450px] overflow-y-auto space-y-6 no-scrollbar mask-radial-faded">
        {visibleMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === 'buyer' ? 'items-start' : msg.role === 'seller' ? 'items-end' : 'items-center'} animate-fadeInUp`}
          >
            <div className={`
              max-w-[90%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed font-medium
              ${msg.role === 'buyer'
                ? 'bg-indigo-500/10 text-indigo-300 rounded-tl-none border border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]'
                : msg.role === 'seller'
                  ? 'bg-purple-500/10 text-purple-300 rounded-tr-none border border-purple-500/20 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]'
                  : 'bg-white/10 text-white border border-white/10 text-center font-black uppercase tracking-widest text-[10px] py-2 px-6 rounded-full shadow-glow'}
            `}>
              {msg.text}
            </div>
            {msg.role !== 'system' && (
              <span className="text-[9px] mt-2 text-slate uppercase font-bold tracking-[0.2em] opacity-40">
                {msg.role === 'buyer' ? 'Origin Agent' : 'Destination Agent'}
              </span>
            )}
          </div>
        ))}
        {index < messages.length && (
          <div className="flex gap-2 items-center px-4 py-2 bg-white/5 rounded-full w-fit animate-pulse">
            <Coins size={14} className="text-cyan-400" />
            <span className="text-[10px] font-bold text-slate uppercase tracking-widest">Processing</span>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-bounce delay-75" />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-bounce delay-150" />
          </div>
        )}
      </div>

      {/* Chat Footer */}
      <div className="p-6 bg-ink-900/40 border-t border-white/5 flex gap-4">
        <div className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center px-4">
           <div className="w-2 h-4 bg-cyan-400/50 animate-pulse" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow">
           <div className="w-4 h-4 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default ChatDemo;
