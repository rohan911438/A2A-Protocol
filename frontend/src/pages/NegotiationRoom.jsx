import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, ArrowRight, Zap, CheckCircle2, MoreHorizontal, Coins } from 'lucide-react';
import { getDeal, startNegotiation, acceptDealWithWallet } from '../services/DealService';
import { useWallet } from '../context/WalletContext';

const NegotiationRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const dealId = location.state?.dealId || null;
  const [dealData, setDealData] = useState(null);
  const [dealStatus, setDealStatus] = useState('created');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const { account, connected } = useWallet();

  useEffect(() => {
    if (!dealId) return;
    getDeal(dealId)
      .then((res) => {
        setDealData(res);
        setDealStatus(res?.status || 'created');
        const convo = res?.data?.result?.conversation || res?.data?.conversation || [];
        if (convo.length) {
          setMessages(mapConversation(convo));
          setIsComplete(true);
        }
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
    return title || desc.split('—')[0]?.trim() || 'New Deal';
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
    if (!dealId) return;
    setLoading(true);
    setError('');
    setIsTyping(true);
    try {
      const result = await startNegotiation(dealId);
      const convo = result.conversation || [];
      const mappedMessages = mapConversation(convo);
      
      setMessages([]); 
      for (const msg of mappedMessages) {
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1000));
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
      setError('Connect wallet to authorize.');
      return;
    }
    if (!dealId) return;
    setAccepting(true);
    setError('');
    try {
      await acceptDealWithWallet(dealId, account);
      setDealStatus('accepted');
    } catch (err) {
      setError(err.message || 'Authorization failed');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-ink-900 flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-aqua/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blush/5 blur-[120px] rounded-full -z-10" />

      <div className="w-full max-w-4xl px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5 bg-ink-900/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Zap className="text-aqua animate-pulse" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-display italic uppercase">Protocol Room</h1>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isComplete ? 'bg-lime' : 'bg-aqua animate-ping'}`} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-slate">
                {isComplete ? 'Consensus Reached' : (dealStatus === 'accepted' ? 'Agents Initialized' : 'Awaiting Peer Activation')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
           <div className="text-[10px] font-mono text-slate uppercase tracking-widest">Context:</div>
           <div className="text-xs font-bold text-white">{dealTitle}</div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-3xl overflow-y-auto px-6 py-10 space-y-8 no-scrollbar scroll-smooth mb-28" ref={scrollRef}>
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && dealData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 py-10 text-center"
            >
              <div className="p-8 rounded-[2rem] bg-ink-800/40 border border-white/10 max-w-lg">
                <div className="text-[10px] uppercase font-mono text-aqua/60 tracking-widest mb-3">Objective Vector</div>
                <p className="text-white/80 italic leading-relaxed font-display text-sm">
                  "{dealData?.data?.request?.description || dealData?.data?.description}"
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-px bg-gradient-to-b from-white/10 to-transparent" />
                <p className="text-[10px] uppercase font-mono text-slate tracking-[0.2em] animate-pulse">
                  {dealStatus === 'created' ? 'Waiting for participant to authorize the protocol...' : 'Autonomous agents are negotiating terms...'}
                </p>
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`flex items-end gap-3 ${msg.role === 'buyer' ? 'flex-row' : 'flex-row-reverse'}`}
            >
              <div className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'buyer' ? 'bg-aqua/20' : 'bg-blush/20'}`}>
                {msg.role === 'buyer' ? <User size={20} className="text-aqua" /> : <Bot size={20} className="text-blush" />}
              </div>
              <div className="space-y-1 max-w-[80%]">
                <div className={`px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-soft border backdrop-blur-md ${
                  msg.role === 'buyer' 
                  ? 'bg-aqua/10 border-aqua/20 text-white rounded-bl-none' 
                  : 'bg-blush/10 border-blush/20 text-white rounded-br-none'
                }`}>
                  {msg.text}
                  {msg.price && (
                    <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      msg.role === 'buyer' ? 'bg-aqua text-ink-900' : 'bg-blush text-ink-900'
                    }`}>
                      <Coins size={12} className="inline-block" /> {msg.price} XLM
                    </div>
                  )}
                </div>
                <div className={`text-[9px] uppercase tracking-widest font-mono text-slate/40 flex items-center gap-2 ${msg.role === 'buyer' ? 'text-left' : 'text-right flex-row-reverse'}`}>
                  <span>{msg.role === 'buyer' ? 'Buyer Agent' : 'Seller Agent'}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span>Verified Logic</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

      {isTyping && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-end gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative">
               <div className="absolute inset-0 rounded-full border border-aqua/20 animate-ping opacity-20" />
               <MoreHorizontal size={16} className="text-slate/40" />
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-10 left-6 right-6 z-50 flex justify-center"
        >
          <div className="max-w-2xl w-full p-1 rounded-[2rem] bg-gradient-to-r from-aqua/50 via-blush/50 to-aqua/50 shadow-[0_0_50px_rgba(94,240,255,0.2)] backdrop-blur-xl">
             <div className="bg-ink-900/90 rounded-[1.9rem] px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/5">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                     isComplete ? 'bg-lime/20 border-lime/30' : 
                     dealStatus === 'accepted' ? 'bg-aqua/20 border-aqua/30' : 'bg-white/5 border-white/10'
                   }`}>
                      {isComplete ? <CheckCircle2 size={24} className="text-lime" /> : <Zap size={24} className={dealStatus === 'accepted' ? 'text-aqua' : 'text-slate'} />}
                   </div>
                   <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-slate mb-0.5">
                        {isComplete ? 'Protocol Consensus' : (dealStatus === 'accepted' ? 'Ready to Deploy' : 'Peer Authorization')}
                      </div>
                      <div className="text-lg font-bold text-white font-display uppercase tracking-tight">
                        {isComplete ? 'Deal Synthesized' : (dealStatus === 'accepted' ? 'Ignite Agents' : 'Awaiting Peer')}
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {isComplete ? (
                    <button
                      onClick={() => navigate('/summary', { state: { dealId } })}
                      className="w-full sm:w-auto px-10 py-3.5 bg-white text-ink-900 font-bold rounded-2xl hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                    >
                      Inspect Agreement <ArrowRight size={16} />
                    </button>
                  ) : (
                    <>
                      {dealStatus === 'created' && !isBuyer && (
                         <button
                            onClick={handleAccept}
                            disabled={accepting}
                            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-aqua to-blush text-ink-900 font-bold rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                         >
                            {accepting ? 'Authorizing...' : 'Authorize & Launch'} <Zap size={18} />
                         </button>
                      )}
                      
                      {dealStatus === 'accepted' && (
                        <button 
                          onClick={handleStart}
                          disabled={loading}
                          className="w-full sm:w-auto px-8 py-3.5 bg-white text-ink-900 font-bold rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                        >
                          {loading ? 'Negotiating...' : 'Start Logic Agents'} <ArrowRight size={18} />
                        </button>
                      )}

                      {dealStatus === 'created' && isBuyer && (
                        <div className="px-8 py-3.5 bg-white/5 border border-white/10 text-slate font-bold rounded-2xl cursor-not-allowed flex items-center gap-2 uppercase tracking-widest text-[10px]">
                           Peer Pending <MoreHorizontal size={18} className="animate-pulse" />
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
        <div className="text-xs text-blush mb-10 bg-blush/5 px-4 py-2 rounded-lg border border-blush/20 uppercase tracking-widest font-mono">{error}</div>
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
