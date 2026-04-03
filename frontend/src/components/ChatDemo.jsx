import React, { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';

const messages = [
  { role: 'buyer', text: "Hey, I can do this project for 300 ALGO considering the scope.", delay: 1000 },
  { role: 'seller', text: "I understand, but given the complexity, I’d need at least 450 ALGO.", delay: 2000 },
  { role: 'buyer', text: "If we adjust the timeline, can we settle at 350 ALGO?", delay: 2500 },
  { role: 'seller', text: "Alright, 380 ALGO works if milestones are defined.", delay: 2000 },
  { role: 'system', text: "🤝 DEAL CLOSED at 380 ALGO", delay: 1500 }
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
      // Loop or pause
      const resetTimer = setTimeout(() => {
        setVisibleMessages([]);
        setIndex(0);
      }, 5000);
      return () => clearTimeout(resetTimer);
    }
  }, [index]);

  return (
    <div className="w-full max-w-md bg-ink-800 rounded-2xl border border-white/10 shadow-soft overflow-hidden animate-floaty">
      {/* Chat header */}
      <div className="px-5 py-4 bg-ink-700/50 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-aqua animate-pulse" />
            <span className="text-xs font-mono text-slate uppercase tracking-widest">Active Negotiation</span>
        </div>
        <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Chat messages */}
      <div className="p-6 h-[400px] overflow-y-auto space-y-4 no-scrollbar">
        {visibleMessages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex flex-col ${msg.role === 'buyer' ? 'items-start' : msg.role === 'seller' ? 'items-end' : 'items-center'} animate-fadeInUp`}
          >
            <div className={`
              max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'buyer' 
                ? 'bg-aqua/10 text-aqua rounded-tl-none border border-aqua/20' 
                : msg.role === 'seller' 
                ? 'bg-blush/10 text-blush rounded-tr-none border border-blush/20' 
                : 'bg-ink-700 text-white border border-white/10 text-center font-bold'}
            `}>
              {msg.text}
            </div>
            {msg.role !== 'system' && (
                <span className="text-[10px] mt-1 text-slate uppercase font-mono tracking-tighter">
                    {msg.role === 'buyer' ? 'Buyer Agent' : 'Seller Agent'}
                </span>
            )}
          </div>
        ))}
        {index < messages.length && (
            <div className="flex gap-1 items-center animate-pulse">
                <label className="flex items-center gap-2 text-sm font-medium text-slate ml-1">
                  <Coins size={16} className="text-aqua" />
                  Min Budget (ALGO)
                </label>
                <div className="w-1.5 h-1.5 rounded-full bg-slate" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate" />
            </div>
        )}
      </div>
      
      {/* Chat Footer */}
      <div className="px-6 py-4 bg-ink-900/40 border-t border-white/5 flex gap-3">
         <div className="flex-1 h-9 rounded-full bg-ink-700 border border-white/5" />
         <div className="w-9 h-9 rounded-full bg-gradient-to-r from-aqua to-blush opacity-20" />
      </div>
    </div>
  );
};

export default ChatDemo;
