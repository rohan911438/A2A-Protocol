import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Clock, CheckCircle2, Circle, ArrowRight, AlertCircle, Coins, Activity, Terminal, Shield, Cpu, Lock, Database, Zap } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { getContractInfo, getReleaseTxn, submitSignedXdr } from '../services/ContractService';
import { getDeal, recordRelease, completeDeal } from '../services/DealService';
import NeuralBackground from '../components/NeuralBackground';

const DEFAULT_SELLER_WALLET = 'GC5OZM7AY73DKZMPWU5BMW3EA6BXCYJIIF6UUQQ44XT4DOJQOXQZU2YF';

const ActiveDeal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dealId = location.state?.dealId || null;
  const { account, connected, signTransaction, fetchBalances } = useWallet();
  const [milestones, setMilestones] = useState([]);
  const [contractInfo, setContractInfo] = useState(null);
  const [dealRecord, setDealRecord] = useState(null);
  const [txStatus, setTxStatus] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    getContractInfo().then(setContractInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (!dealId) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    let mounted = true;
    const fetchDeal = () => getDeal(dealId)
      .then((data) => {
        if(mounted) {
          setDealRecord(data);
          setLoadingData(false);
        }
      })
      .catch(() => {
        if(mounted) setLoadingData(false);
      });
    fetchDeal();
    const timer = setInterval(fetchDeal, 5000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [dealId]);

  useEffect(() => {
    const defaultTasks = ["Neural Model Calibration", "Context Synthesis", "Validation Sequence"];
    const result = dealRecord?.data?.result || {};
    const finalPrice = result.final_price || 0;
    const milestoneAmounts = result.milestones?.length
      ? result.milestones
      : finalPrice
        ? [Math.round(finalPrice * 0.4), Math.max(finalPrice - Math.round(finalPrice * 0.4), 0)].filter((v) => v > 0)
        : [0, 0];

    const releases = dealRecord?.data?.releases?.completed || [];
    const releasedSet = new Set(releases);
    let firstOpen = 0;
    for (let i = 0; i < milestoneAmounts.length; i++) {
      if (!releasedSet.has(i)) {
        firstOpen = i;
        break;
      }
    }
    const mapped = milestoneAmounts.map((amt, idx) => {
      let status = "Pending";
      if (releasedSet.has(idx)) status = "Completed";
      else if (idx === firstOpen) status = "In Progress";
      return {
        id: idx + 1,
        task: defaultTasks[idx] || `Sequence Phase ${idx + 1}`,
        status,
        amount: amt,
      };
    });
    setMilestones(mapped);
  }, [dealRecord]);

  const dealTitle = useMemo(() => {
    const request = dealRecord?.data?.request || dealRecord?.data || {};
    return request?.title || request?.description?.split('—')[0]?.trim() || 'Active Protocol';
  }, [dealRecord]);

  const totalPrice = useMemo(() => {
    const result = dealRecord?.data?.result || {};
    return result.final_price || 0;
  }, [dealRecord]);

  const sellerWalletRaw = useMemo(() => {
    const request = dealRecord?.data?.request || dealRecord?.data || {};
    return dealRecord?.data?.seller_wallet || request?.seller_wallet || DEFAULT_SELLER_WALLET;
  }, [dealRecord]);

  const isValidStellarAccount = (value) => typeof value === 'string' && /^G[A-Z2-7]{55}$/.test(value);

  const buyerWallet = useMemo(() => {
    const request = dealRecord?.data?.request || dealRecord?.data || {};
    return (request?.buyer_wallet || '').toLowerCase();
  }, [dealRecord]);

  const isBuyer = useMemo(() => {
    if (!account) return false;
    return buyerWallet && account.toLowerCase() === buyerWallet;
  }, [account, buyerWallet]);

  const senderWalletValid = isValidStellarAccount(account || '');
  const sellerWalletValid = isValidStellarAccount(sellerWalletRaw);

  const handleRelease = async (milestone) => {
    if (!connected || !account) {
      setTxStatus('Connect wallet to authorize disbursement.');
      return;
    }
    if (!isValidStellarAccount(account)) {
      setTxStatus('Invalid sender account. Reconnect wallet and use a Stellar account (G...).');
      return;
    }
    if (!isValidStellarAccount(sellerWalletRaw)) {
      setTxStatus('Seller wallet is missing or invalid. Set seller wallet before releasing milestone funds.');
      return;
    }
    setLoadingId(milestone.id);
    setTxStatus('Constructing Stellar XDR Payload...');
    try {
      const { xdr } = await getReleaseTxn(account, dealId, milestone.id - 1, milestone.amount, sellerWalletRaw);
      
      setTxStatus('Protocol awaiting signature...');
      const signedXdr = await signTransaction(xdr);
      
      setTxStatus('Syncing with Stellar consensus...');
      const { tx_hash } = await submitSignedXdr(signedXdr);
      
      await recordRelease(dealId, milestone.id - 1, tx_hash);
      setTxStatus(`Success. Snapshot: ${tx_hash.substring(0, 8)}...`);
      await fetchBalances();
    } catch (err) {
      setTxStatus(err.message || 'Signature Error');
    } finally {
      setLoadingId(null);
    }
  };

  const completedCount = milestones.filter(m => m.status === 'Completed').length;
  const progressPercent = milestones.length ? (completedCount / milestones.length) * 100 : 0;

  if (loadingData) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <NeuralBackground />
        <div className="w-16 h-16 rounded-2xl border-2 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center">
            <Cpu className="text-indigo-400" size={24} />
        </div>
        <p className="mt-6 text-mist/60 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">Syncing Node State...</p>
      </div>
    );
  }

  if (!dealId) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <NeuralBackground />
        <div className="max-w-xl w-full text-center space-y-8 glass-morphism border border-white/10 rounded-[3rem] p-12">
          <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight">No Active Deal Selected</h2>
          <p className="text-slate/70 text-sm font-medium">Open this page from Dashboard or Summary so a valid deal context is provided.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-10 py-4 bg-white text-ink-900 font-black rounded-2xl hover:scale-105 transition-all shadow-glow uppercase tracking-[0.2em] text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen flex flex-col items-center relative overflow-hidden selection:bg-indigo-500/30 selection:text-stellar-cyan">
      <NeuralBackground />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full space-y-12 z-10"
      >
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-white/5 pb-12">
          <div className="space-y-6">
             <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                <ShieldCheck size={14} /> Protocol Locked • XDR Secured
             </div>
             <h1 className="text-5xl lg:text-6xl font-display font-black text-white uppercase tracking-tighter leading-tight">{dealTitle}</h1>
          </div>
          <div className="flex gap-12 border-l border-white/10 pl-12 h-fit">
             <div className="space-y-3">
                <span className="text-[10px] uppercase font-black text-slate tracking-[0.3em] opacity-40 block">Escrow Equilibrium</span>
                <span className="text-4xl font-display font-black text-white tracking-tighter flex items-center gap-3">
                   {totalPrice} <span className="text-xs font-mono text-indigo-400 mt-2 uppercase tracking-widest">XLM</span>
                </span>
             </div>
          </div>
        </div>

        {/* Global Progress Container */}
        <div className="glass-morphism border border-white/10 p-10 rounded-[3.5rem] space-y-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.03] blur-[100px] -z-10 group-hover:bg-indigo-500/[0.07] transition-all duration-1000" />
           
           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/60">
              <span>Settlement Gradient</span>
              <span className="text-white">{Math.round(progressPercent)}%</span>
           </div>
           
           <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden shadow-inner flex items-center p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 via-stellar-cyan to-cyber-purple rounded-full shadow-glow"
              />
           </div>
           
           <div className="flex flex-wrap items-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate opacity-40">
              <div className="flex items-center gap-2"><Activity size={14} className="text-emerald-400" /> Real-time Node Sync</div>
              <div className="flex items-center gap-2"><Database size={14} className="text-indigo-400" /> Ledger Snapshot #4,291</div>
              <div className="flex items-center gap-2"><Clock size={14} className="text-stellar-cyan" /> Epoch Latency: 12ms</div>
           </div>
        </div>

        {/* Milestones Sequence */}
        <div className="space-y-8">
           <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-4">
              <Terminal size={18} className="text-indigo-500" />
              <span>Logic Sequence</span>
              <div className="flex-grow h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
           </h2>

           <div className="space-y-6 relative">
              {milestones.map((m, i) => (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-10 rounded-[3.5rem] border-2 transition-all duration-500 group relative overflow-hidden ${
                    m.status === 'Completed' 
                    ? 'bg-emerald-400/[0.03] border-emerald-400/20 shadow-glow-sm' 
                    : m.status === 'In Progress' 
                    ? 'glass-morphism border-indigo-500/40 shadow-2xl scale-[1.02]' 
                    : 'bg-white/[0.01] border-white/5 opacity-40'
                  }`}
                >
                   {m.status === 'In Progress' && (
                       <div className="absolute inset-0 bg-indigo-500/[0.02] animate-pulse" />
                   )}
                   
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                      <div className="flex items-center gap-8">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                             m.status === 'Completed' 
                             ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400' 
                             : m.status === 'In Progress'
                             ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-glow'
                             : 'bg-white/5 border-white/10 text-slate/20'
                         }`}>
                            {m.status === 'Completed' ? <CheckCircle2 size={32} /> : m.status === 'In Progress' ? <Activity size={32} className="animate-spin-slow" /> : <Lock size={32} />}
                         </div>
                         <div className="space-y-2">
                            <h3 className={`text-2xl font-display font-black transition-colors uppercase tracking-tight ${m.status === 'Completed' ? 'text-white' : m.status === 'In Progress' ? 'text-white' : 'text-slate'}`}>{m.task}</h3>
                            <div className="flex items-center gap-4">
                               <div className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-indigo-400 flex items-center gap-2">
                                 <Coins size={12} /> {m.amount} XLM
                               </div>
                               <div className="w-1 h-1 rounded-full bg-white/10" />
                               <div className="text-[9px] font-black uppercase tracking-widest text-slate opacity-40">Phase Sequence Snapshot</div>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto">
                        {m.status === 'In Progress' ? (
                          isBuyer ? (
                            <button 
                              onClick={() => handleRelease(m)}
                              disabled={loadingId === m.id}
                              className="w-full md:w-auto px-10 py-5 bg-white text-ink-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 shadow-glow group/btn"
                            >
                               {loadingId === m.id ? 'SYNCHRONIZING...' : 'AUTHORIZE RELEASE'} 
                               <Zap size={16} className={loadingId === m.id ? 'animate-pulse' : 'group-hover/btn:rotate-12 transition-transform'} />
                            </button>
                          ) : (
                            <div className="text-[10px] font-black text-stellar-cyan uppercase tracking-[0.3em] flex items-center gap-3 px-6 py-4 glass-morphism rounded-2xl border border-stellar-cyan/20 shadow-glow-sm">
                               <AlertCircle size={16} /> Awaiting Peer Auth
                            </div>
                          )
                        ) : m.status === 'Pending' ? (
                          <div className="text-[10px] font-black text-slate/20 uppercase tracking-[0.4em] flex items-center gap-3 px-8">
                             <Lock size={16} /> Sequence Lock
                          </div>
                        ) : (
                          <div className="px-6 py-4 rounded-2xl bg-emerald-400/5 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 border border-emerald-400/20 shadow-inner">
                             <CheckCircle2 size={16} /> Ledger Verified
                          </div>
                        )}
                      </div>
                   </div>
                </motion.div>
              ))}
              
              {/* Decorative vertical rail */}
              <div className="absolute top-10 bottom-10 left-[3.25rem] w-px bg-white/5 -z-10" />
           </div>

           {isBuyer && (!senderWalletValid || !sellerWalletValid) && (
             <div className="text-[10px] font-black text-amber-300 uppercase tracking-[0.25em] bg-amber-300/10 border border-amber-300/20 rounded-2xl px-6 py-4">
               {senderWalletValid
                 ? 'Seller wallet is not set yet. Ask seller to accept with wallet from Negotiation Room before releasing.'
                 : 'Sender wallet is invalid. Reconnect wallet and select a Stellar account (G...).'}
             </div>
           )}
        </div>

        <AnimatePresence>
            {txStatus && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[10px] font-mono font-black text-stellar-cyan uppercase tracking-[0.4em] text-center bg-stellar-cyan/5 py-5 rounded-3xl border border-stellar-cyan/10"
                >
                    <Activity size={14} className="inline-block mr-4 animate-pulse" /> {txStatus}
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
        {completedCount === milestones.length && milestones.length > 0 && (
             <motion.div 
               initial={{ y: 30, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="p-12 md:p-16 rounded-[4rem] glass-morphism border-2 border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group shadow-2xl"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-stellar-cyan/5 to-cyber-purple/10 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="space-y-4 relative z-10 text-center md:text-left">
                   <h3 className="text-4xl font-display font-black text-white uppercase tracking-tighter leading-none">Protocol Objective <br/> Fulfilled</h3>
                   <div className="flex items-center justify-center md:justify-start gap-4">
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Node Synthesis Finalized</div>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                   </div>
                </div>
                {isBuyer ? (
                  <button 
                    onClick={async () => {
                      try {
                        await completeDeal(dealId);
                        navigate('/dashboard');
                      } catch (err) {
                        setTxStatus('Protocol Tear-down Failed');
                      }
                    }}
                    className="px-16 py-7 bg-white text-ink-900 font-black rounded-[2rem] hover:scale-105 transition-all shadow-glow flex items-center justify-center gap-4 z-10 uppercase tracking-[0.3em] text-xs relative overflow-hidden"
                  >
                     <span className="relative z-10 flex items-center gap-3">Close Lifecycle <ArrowRight size={20} /></span>
                  </button>
                ) : (
                  <div className="relative z-10 text-[10px] font-black text-white/40 uppercase tracking-[0.4em] bg-white/5 px-8 py-5 rounded-3xl border border-white/10 shadow-inner">
                    Awaiting peer to terminate session
                  </div>
                )}
             </motion.div>
           )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

export default ActiveDeal;
