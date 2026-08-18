import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, ArrowRight, Zap, CheckCircle2, MoreHorizontal, Coins, ShieldCheck } from 'lucide-react';
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
    // Only auto-run negotiation once the seller has accepted the invite -
    // this used to trigger on 'created', which meant the buyer's own page
    // load kicked off negotiation before the seller ever clicked "Accept
    // Invite", making that button decorative.
    if (dealId && dealStatus === 'accepted' && messages.length === 0 && !loading && !isTyping) {
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
    return title || desc.split('—')[0]?.trim() || 'Negotiation';
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
      setError(err.message || 'Negotiation failed');
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!connected || !account) {
      setError('Connect your wallet to accept this deal.');
      return;
    }
    if (!isValidStellarAccount(account)) {
      setError('Invalid wallet account. Reconnect and use a Stellar account (G...).');
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
      setError(err.message || 'Failed to accept the deal');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-paper flex flex-col items-center relative">
      {/* Header */}
      <div className="w-full h-20 bg-paper/90 backdrop-blur-md border-b border-line flex items-center z-20 px-6">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-clay-500/10 border border-clay-500/25 flex items-center justify-center text-clay-400">
              <Bot size={18} />
            </div>
            <div>
              <h1 className="text-base font-serif font-medium text-bark">Negotiation</h1>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-moss-400' : 'bg-clay-400 animate-pulse'}`} />
                <span className="text-[11px] font-medium text-bark-faint">
                  {isComplete ? 'Terms agreed' : 'Negotiating live'}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-surface border border-line">
            <span className="text-xs font-semibold text-bark-faint">Deal:</span>
            <span className="text-sm font-medium text-bark">{dealTitle}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 w-full max-w-6xl px-6 py-10 pb-40 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start">
        <div className="space-y-6 overflow-y-auto no-scrollbar" ref={scrollRef}>
          <AnimatePresence mode="popLayout">
            {messages.length === 0 && dealData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-6 py-16 text-center"
              >
                <div className="paper-card p-8 max-w-xl relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-clay-500 text-[11px] font-semibold text-white">Brief</div>
                  <p className="text-base text-bark leading-relaxed italic mt-2">
                    "{dealData?.data?.request?.description || dealData?.data?.description}"
                  </p>
                  <div className="mt-6 flex justify-center gap-8 text-bark-faint">
                    <div className="flex flex-col items-center gap-1.5">
                      <User size={14} className="text-clay-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Buyer agent</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <Bot size={14} className="text-moss-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Seller agent</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-bark-faint">
                  {dealStatus === 'created' ? 'Waiting for the seller to accept...' : 'Negotiating terms...'}
                </p>
              </motion.div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`flex items-start gap-4 ${msg.role === 'buyer' ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${msg.role === 'buyer' ? 'bg-clay-500/10 border-clay-500/25' : 'bg-moss-400/10 border-moss-400/25'}`}>
                  {msg.role === 'buyer' ? <User size={18} className="text-clay-400" /> : <Bot size={18} className="text-moss-400" />}
                </div>

                <div className={`space-y-1.5 max-w-[85%] ${msg.role === 'buyer' ? 'items-start' : 'items-end flex flex-col'}`}>
                  <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed border ${
                      msg.role === 'buyer'
                      ? 'bg-clay-500/[0.06] border-clay-500/20 text-bark rounded-tl-sm'
                      : 'bg-moss-400/[0.06] border-moss-400/20 text-bark rounded-tr-sm'
                    }`}>
                    {msg.text}
                    {msg.price && (
                      <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${
                        msg.role === 'buyer' ? 'bg-clay-500' : 'bg-moss-500'
                      }`}>
                        <Coins size={12} /> {msg.price} XLM
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-bark-faint">{msg.role === 'buyer' ? 'Buyer agent' : 'Seller agent'}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-surface border border-line flex items-center justify-center">
                <MoreHorizontal size={16} className="text-clay-400" />
              </div>
              <span className="text-xs font-medium text-bark-faint">Thinking...</span>
            </motion.div>
          )}
        </div>

        {/* Reasoning panel */}
        <aside className="paper-card p-6 lg:sticky lg:top-28 max-h-[70vh] overflow-y-auto no-scrollbar">
          <h3 className="text-xs font-semibold text-bark-faint uppercase tracking-widest mb-5">Agent reasoning</h3>

          {reasoningLogs.length === 0 ? (
            <div className="text-sm text-bark-faint leading-relaxed">
              Reasoning will appear here once negotiation starts.
            </div>
          ) : (
            <div className="space-y-4">
              {reasoningLogs.map((step) => (
                <div key={`reason-${step.round}`} className="rounded-xl bg-surface border border-line p-4 space-y-2.5">
                  <div className="text-[11px] font-semibold text-clay-400 uppercase tracking-wider">Round {step.round}</div>
                  <p className="text-xs text-bark leading-relaxed"><span className="text-clay-400 font-semibold">Buyer:</span> {step.buyer_reasoning}</p>
                  <p className="text-xs text-bark leading-relaxed"><span className="text-moss-400 font-semibold">Seller:</span> {step.seller_reasoning}</p>
                  <div className="pt-2 border-t border-line space-y-1 text-[11px] text-bark-faint">
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

      {/* Control dock */}
      <div className="fixed bottom-8 left-6 right-6 z-50 flex justify-center">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="max-w-3xl w-full paper-card px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              isComplete ? 'bg-moss-400/10 border-moss-400/30' :
              dealStatus === 'accepted' ? 'bg-clay-500/10 border-clay-500/30' : 'bg-surface border-line'
            }`}>
              {isComplete ? <CheckCircle2 size={22} className="text-moss-400" /> : <Zap size={22} className={dealStatus === 'accepted' ? 'text-clay-400' : 'text-bark-faint'} />}
            </div>
            <div>
              <div className="text-[11px] font-semibold text-bark-faint uppercase tracking-widest mb-0.5">
                {isComplete ? 'Deal agreed' : (dealStatus === 'accepted' ? 'Ready to negotiate' : 'Waiting for seller')}
              </div>
              <div className="text-lg font-serif font-medium text-bark">
                {isComplete ? 'Terms locked' : (dealStatus === 'accepted' ? 'Start negotiation' : 'Awaiting acceptance')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!dealId && (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-surface border border-line text-bark text-sm font-medium hover:border-clay-400/30 transition-all flex items-center justify-center gap-2"
              >
                Open Dashboard <ArrowRight size={16} />
              </button>
            )}
            {isComplete ? (
              <button
                onClick={() => navigate('/summary', { state: { dealId } })}
                className="w-full sm:w-auto btn-clay flex items-center justify-center gap-2"
              >
                Review agreement <ArrowRight size={16} />
              </button>
            ) : (
              <>
                {dealStatus === 'created' && !isBuyer && (
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full sm:w-auto btn-clay flex items-center justify-center gap-2"
                  >
                    {accepting ? (
                      <>Processing... <MoreHorizontal size={18} className="animate-pulse" /></>
                    ) : (
                      <>Accept &amp; join <Zap size={16} /></>
                    )}
                  </button>
                )}

                {dealStatus === 'accepted' && (
                  <button
                    onClick={handleStart}
                    disabled={loading}
                    className="w-full sm:w-auto btn-clay flex items-center justify-center gap-2"
                  >
                    {loading ? 'Negotiating...' : 'Start negotiation'} <ArrowRight size={16} />
                  </button>
                )}

                {dealStatus === 'created' && isBuyer && (
                  <div className="px-6 py-3.5 rounded-xl bg-surface border border-line text-bark-faint text-sm font-medium flex items-center gap-2">
                    Waiting for seller <MoreHorizontal size={16} className="animate-pulse" />
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 text-sm text-red-300 bg-red-400/10 px-5 py-3 rounded-xl border border-red-400/20 shadow-2xl z-50"
        >
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
