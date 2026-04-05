import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, ArrowRight, Zap, CheckCircle2, MoreHorizontal, Coins, Shield, Terminal, Cpu } from 'lucide-react';
import { getDeal, startNegotiation, acceptDealWithWallet, listDeals } from '../services/DealService';
import { useWallet } from '../context/WalletContext';

const NegotiationRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [dealId, setDealId] = useState(location.state?.dealId || localStorage.getItem('last_deal_id') || null);
  const [dealData, setDealData] = useState(null);
  const [dealStatus, setDealStatus] = useState('created');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [reasoningLogs, setReasoningLogs] = useState([]);
  const { account, connected, formatAddress } = useWallet();

  const isValidStellarAccount = (value) => typeof value === 'string' && /^G[A-Z2-7]{55}$/.test(value);

  useEffect(() => {
    if (location.state?.dealId) {
      setDealId(location.state.dealId);
      localStorage.setItem('last_deal_id', location.state.dealId);
    }
  }, [location.state]);

  const resolveDealId = async () => {
    const allDeals = await listDeals();
    const entries = Object.entries(allDeals || {});
    if (!entries.length) return null;

    // Prefer deals still in pre-consensus flow, then fallback to latest entry.
    const preferred = ['created', 'accepted', 'running', 'negotiated', 'active'];
    let selected = null;
    for (const status of preferred) {
      const match = entries.find(([, rec]) => (rec?.status || '').toLowerCase() === status);
      if (match) {
        selected = match[0];
        break;
      }
    }
    if (!selected) {
      selected = entries[entries.length - 1][0];
    }

    setDealId(selected);
    localStorage.setItem('last_deal_id', selected);
    return selected;
  };

  useEffect(() => {
    if (dealId) return;
    resolveDealId().catch(() => {
      setError('No deal found. Create a deal first.');
    });
  }, [dealId]);

  useEffect(() => {
    if (!dealId) return;
    getDeal(dealId)
      .then((res) => {
        setDealData(res);
        setDealStatus(res?.status || 'created');
        const convo = res?.data?.result?.conversation || res?.data?.conversation || [];
        const reasoning = res?.data?.result?.reasoning || res?.data?.reasoning || [];
        if (convo.length) {
          setMessages(mapConversation(convo));
          setIsComplete(true);
        }
        setReasoningLogs(reasoning);
      })
      .catch(() => {});
  }, [dealId]);

  useEffect(() => {
    if (dealId && dealStatus === 'created' && messages.length === 0 && !loading && !isTyping) {
      handleStart();
    }
  }, [dealId, dealStatus, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const dealTitle = useMemo(() => {
    const request = dealData?.data?.request || dealData?.data || {};
    const title = request?.title || '';
    const desc = request?.description || '';
    return title || desc.split('—')[0]?.trim() || 'Neural Session';
  }, [dealData]);

  const buyerWallet = useMemo(() => {
    const request = dealData?.data?.request || dealData?.data || {};
    return (request?.buyer_wallet || '').toLowerCase();
  }, [dealData]);

  const isBuyer = useMemo(() => {
    if (!account) return false;
    return buyerWallet && account.toLowerCase() === buyerWallet;
  }, [account, buyerWallet]);

  const handleStart = async () => {
    let targetDealId = dealId;
    if (!targetDealId) {
      targetDealId = await resolveDealId();
      if (!targetDealId) {
        setError('No deal found. Create a deal first.');
        return;
      }
    }
    setLoading(true);
    setError('');
    setIsTyping(true);
    try {
      const result = await startNegotiation(targetDealId);
      const convo = result.conversation || [];
      const reasoning = result.reasoning || [];
      const mappedMessages = mapConversation(convo);
      setReasoningLogs(reasoning);
      
      setMessages([]); 
      for (const msg of mappedMessages) {
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        setMessages(prev => [...prev, msg]);
        setIsTyping(false);
      }
      setIsComplete(true);
    } catch (err) {
      setError(err.message || 'Protocol negotiation failed');
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!connected || !account) {
      setError('Connect wallet to authorize protocol.');
      return;
    }
    if (!isValidStellarAccount(account)) {
      setError('Invalid wallet account. Reconnect wallet and use a Stellar account (G...).');
      return;
    }
    let targetDealId = dealId;
    if (!targetDealId) {
      targetDealId = await resolveDealId();
      if (!targetDealId) {
        setError('No deal found. Create a deal first.');
        return;
      }
    }
    setAccepting(true);
    setError('');
    try {
      await acceptDealWithWallet(targetDealId, account);
      setDealStatus('accepted');
      const refreshed = await getDeal(targetDealId).catch(() => null);
      if (refreshed) setDealData(refreshed);
    } catch (err) {
      setError(err.message || 'Authorization failed');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen flex flex-col items-center relative overflow-hidden selection:bg-indigo-500/30 selection:text-stellar-cyan">
      {/* Header Panel */}
      <div className="w-full h-24 glass-morphism border-b border-white/5 flex items-center z-20 px-8 relative">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyber-purple p-[1px] shadow-glow">
                <div className="w-full h-full rounded-[15px] bg-ink-900 flex items-center justify-center">
                    <Terminal className="text-stellar-cyan" size={20} />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-display font-black text-white uppercase tracking-tighter">Negotiation Channel</h1>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-stellar-cyan animate-pulse shadow-[0_0_10px_#22d3ee]'}`} />
                  <span className="text-[9px] font-mono font-bold text-slate uppercase tracking-widest opacity-60">
                    {isComplete ? 'Consensus Secure' : 'Neural Sync Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4 px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
               <div className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-[0.3em]">Objective Vector:</div>
               <div className="text-xs font-bold text-white px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">{dealTitle}</div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <div className="text-[8px] font-black text-slate uppercase tracking-widest opacity-40">Network Load</div>
                    <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-tighter">0.00ms Latency</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate">
                    <Shield size={18} />
                </div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-7xl px-6 py-12 pb-40 z-10 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start">
      <div className="space-y-10 overflow-y-auto no-scrollbar" ref={scrollRef}>
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && dealData && (
             <motion.div
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex flex-col items-center gap-8 py-20 text-center"
             >
               <div className="p-10 rounded-[3rem] glass-morphism border border-white/5 max-w-xl relative group">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] shadow-glow">Initialization Packet</div>
                  <p className="text-lg text-white font-medium leading-relaxed italic opacity-80 decoration-stellar-cyan/30 underline-offset-8 decoration-2">
                    "{dealData?.data?.request?.description || dealData?.data?.description}"
                  </p>
                  <div className="mt-8 flex justify-center gap-6 opacity-40">
                     <div className="flex flex-col items-center gap-1">
                        <Cpu size={14} className="text-stellar-cyan" />
                        <span className="text-[8px] font-bold uppercase tracking-widest">Logic Node 1</span>
                     </div>
                     <div className="flex flex-col items-center gap-1">
                        <Bot size={14} className="text-cyber-purple" />
                        <span className="text-[8px] font-bold uppercase tracking-widest">Logic Node 2</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex flex-col items-center gap-3">
                 <div className="h-16 w-px bg-gradient-to-b from-indigo-500/40 to-transparent" />
                 <p className="text-[10px] font-mono font-bold text-mist/40 uppercase tracking-[0.4em] animate-pulse">
                   {dealStatus === 'created' ? 'Protocol requires peer handshake...' : 'Negotiating Pareto-optimal outcome...'}
                 </p>
               </div>
             </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`flex items-start gap-5 ${msg.role === 'buyer' ? 'flex-row' : 'flex-row-reverse'}`}
            >
              <div className={`w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center shrink-0 shadow-2xl relative group ${msg.role === 'buyer' ? 'bg-indigo-500/10' : 'bg-cyber-purple/10'}`}>
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-lg -z-10 ${msg.role === 'buyer' ? 'bg-indigo-500/40' : 'bg-cyber-purple/40'}`} />
                {msg.role === 'buyer' ? <User size={22} className="text-indigo-400" /> : <Bot size={22} className="text-cyber-purple" />}
              </div>
              
              <div className={`space-y-2 max-w-[85%] ${msg.role === 'buyer' ? 'items-start' : 'items-end flex flex-col'}`}>
                <div className={`
                    px-7 py-5 rounded-[2rem] text-sm leading-relaxed font-medium backdrop-blur-xl border relative shadow-2xl
                    ${msg.role === 'buyer' 
                      ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-100 rounded-tl-none' 
                      : 'bg-cyber-purple/5 border-cyber-purple/20 text-purple-100 rounded-tr-none'
                    }
                `}>
                  {msg.text}
                  {msg.price && (
                    <div className={`mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-widest shadow-lg ${
                      msg.role === 'buyer' ? 'bg-indigo-500 text-white' : 'bg-cyber-purple text-white'
                    }`}>
                      <Coins size={14} /> {msg.price} XLM
                    </div>
                  )}
                </div>
                <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] opacity-30 ${msg.role === 'buyer' ? '' : 'flex-row-reverse'}`}>
                    <span>{msg.role === 'buyer' ? 'Origin Agent' : 'Destination Agent'}</span>
                    <div className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="font-mono">Packet V.{100 + i}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative">
               <div className="absolute inset-0 rounded-2xl border border-stellar-cyan/20 animate-ping opacity-20" />
               <MoreHorizontal size={20} className="text-stellar-cyan" />
            </div>
            <span className="text-[10px] font-black text-stellar-cyan uppercase tracking-[0.3em] animate-pulse">Syncing Logic...</span>
          </motion.div>
        )}
      </div>

      {/* Explainability Panel */}
      <aside className="glass-morphism border border-white/10 rounded-[2rem] p-6 lg:sticky lg:top-28 max-h-[70vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.35em]">Agent Reasoning</h3>
          <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest">Why This Decision</span>
        </div>

        {reasoningLogs.length === 0 ? (
          <div className="text-[11px] text-slate/70 leading-relaxed">
            Reasoning entries will appear here once negotiation steps are executed.
          </div>
        ) : (
          <div className="space-y-4">
            {reasoningLogs.map((step) => (
              <div key={`reason-${step.round}`} className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 space-y-3">
                <div className="text-[10px] font-black text-stellar-cyan uppercase tracking-[0.25em]">Round {step.round}</div>
                <p className="text-xs text-white/90 leading-relaxed"><span className="text-indigo-300 font-bold">Buyer:</span> {step.buyer_reasoning}</p>
                <p className="text-xs text-white/90 leading-relaxed"><span className="text-cyan-300 font-bold">Seller:</span> {step.seller_reasoning}</p>
                <div className="pt-2 border-t border-white/10 space-y-1 text-[10px] text-slate/80">
                  <div>Gap: {step?.factors?.price_adjustment?.price_gap ?? 'N/A'} XLM</div>
                  <div>Deadline: {step?.factors?.deadline_constraints?.note ?? 'N/A'}</div>
                  <div>Reputation: {step?.factors?.seller_reputation?.label ?? 'N/A'} ({step?.factors?.seller_reputation?.score ?? 'N/A'})</div>
                  <div>Risk: {step?.factors?.risk_evaluation?.risk_level ?? 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
      </div>

      {/* Control Navigation Dock */}
      <AnimatePresence>
        <motion.div 
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-12 left-6 right-6 z-50 flex justify-center"
        >
          <div className="max-w-3xl w-full p-[1px] rounded-[2.5rem] bg-gradient-to-r from-indigo-500 via-stellar-cyan to-cyber-purple shadow-[0_0_60px_rgba(99,102,241,0.3)]">
             <div className="bg-ink-900/90 backdrop-blur-3xl rounded-[2.4rem] px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-8 border border-white/5">
                <div className="flex items-center gap-6">
                   <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border-2 transition-all duration-700 shadow-xl ${
                     isComplete ? 'bg-emerald-400/10 border-emerald-400/50 shadow-emerald-400/20' : 
                     dealStatus === 'accepted' ? 'bg-stellar-cyan/10 border-stellar-cyan/50 shadow-stellar-cyan/20' : 'bg-white/5 border-white/10'
                   }`}>
                      {isComplete ? <CheckCircle2 size={32} className="text-emerald-400" /> : <Zap size={32} className={dealStatus === 'accepted' ? 'text-stellar-cyan' : 'text-slate/40'} />}
                   </div>
                   <div>
                      <div className="text-[11px] font-mono font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">
                        {isComplete ? 'Protocol Consensus' : (dealStatus === 'accepted' ? 'Engines Primed' : 'Network Handshake')}
                      </div>
                      <div className="text-2xl font-display font-black text-white uppercase tracking-tighter">
                        {isComplete ? 'Terms Locked' : (dealStatus === 'accepted' ? 'Initialize Agents' : 'Awaiting Peer')}
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-5 w-full sm:w-auto">
                  {!dealId && (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full sm:w-auto px-10 py-5 bg-white/10 border border-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
                    >
                      Open Dashboard <ArrowRight size={18} />
                    </button>
                  )}
                  {isComplete ? (
                    <button
                      onClick={() => navigate('/summary', { state: { dealId } })}
                      className="w-full sm:w-auto px-12 py-5 bg-white text-ink-900 font-black rounded-2xl hover:scale-105 transition-all shadow-glow flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
                    >
                      Audit Agreement <ArrowRight size={18} />
                    </button>
                  ) : (
                    <>
                      {dealStatus === 'created' && !isBuyer && (
                         <button
                            onClick={handleAccept}
                            disabled={accepting}
                            className="w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-indigo-500 to-cyber-purple text-white font-black rounded-2xl hover:scale-105 transition-all shadow-glow flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
                         >
                            {accepting ? (
                                <>Processing... <MoreHorizontal size={20} className="animate-pulse" /></>
                            ) : (
                                <>Accept Invite <Zap size={20} /></>
                            )}
                         </button>
                      )}
                      
                      {dealStatus === 'accepted' && (
                        <button 
                          onClick={handleStart}
                          disabled={loading}
                          className="w-full sm:w-auto px-12 py-5 bg-white text-ink-900 font-black rounded-2xl hover:scale-105 transition-all shadow-glow flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
                        >
                          {loading ? 'Synthesizing...' : 'Deploy Swarm'} <ArrowRight size={20} />
                        </button>
                      )}

                      {dealStatus === 'created' && isBuyer && (
                        <div className="px-10 py-5 bg-white/5 border border-white/10 text-slate font-black rounded-2xl cursor-wait flex items-center gap-3 uppercase tracking-widest text-[11px] opacity-60">
                           Awaiting Peer <MoreHorizontal size={20} className="animate-pulse" />
                        </div>
                      )}
                    </>
                  )}
                </div>
             </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {error && (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 text-xs text-cyber-purple bg-cyber-purple/5 px-6 py-3 rounded-xl border border-cyber-purple/20 uppercase tracking-[0.2em] font-black backdrop-blur-md shadow-2xl z-50">
            {error}
        </motion.div>
      )}
    </div>
  );
};

function mapConversation(conversation) {
  const output = [];
  conversation.forEach((turn) => {
    if (turn.buyer) {
      output.push({ role: 'buyer', text: turn.buyer, price: turn.buyer_price });
    }
    if (turn.seller) {
      output.push({ role: 'seller', text: turn.seller, price: turn.seller_price });
    }
  });
  return output;
}

export default NegotiationRoom;
