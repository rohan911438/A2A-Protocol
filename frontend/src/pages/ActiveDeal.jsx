import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Clock, CheckCircle2, Circle, ArrowRight, AlertCircle, Coins } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { getContractInfo, getReleaseTxn, submitSignedXdr } from '../services/ContractService';
import { getDeal, recordRelease, completeDeal } from '../services/DealService';

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
    const defaultTasks = ["Initial Milestone", "Main Milestone", "Final Settlement"];
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
        task: defaultTasks[idx] || `Milestone ${idx + 1}`,
        status,
        amount: amt,
      };
    });
    setMilestones(mapped);
  }, [dealRecord]);

  const dealTitle = useMemo(() => {
    const request = dealRecord?.data?.request || dealRecord?.data || {};
    return request?.title || request?.description?.split('—')[0]?.trim() || 'Active Deal';
  }, [dealRecord]);

  const totalPrice = useMemo(() => {
    const result = dealRecord?.data?.result || {};
    return result.final_price || 0;
  }, [dealRecord]);

  const sellerWalletRaw = useMemo(() => {
    return dealRecord?.data?.seller_wallet || '';
  }, [dealRecord]);

  const buyerWallet = useMemo(() => {
    const request = dealRecord?.data?.request || dealRecord?.data || {};
    return (request?.buyer_wallet || '').toLowerCase();
  }, [dealRecord]);

  const isBuyer = useMemo(() => {
    if (!account) return false;
    return buyerWallet && account.toLowerCase() === buyerWallet;
  }, [account, buyerWallet]);

  const handleRelease = async (milestone) => {
    if (!connected || !account) {
      setTxStatus('Connect wallet to release XLM.');
      return;
    }
    setLoadingId(milestone.id);
    setTxStatus('Constructing Stellar release XDR...');
    try {
      // destination is the seller
      const { xdr } = await getReleaseTxn(account, dealId, milestone.id - 1, milestone.amount, sellerWalletRaw);
      
      setTxStatus('Awaiting wallet signature...');
      const signedXdr = await signTransaction(xdr);
      
      setTxStatus('Submitting to Stellar network...');
      const { tx_hash } = await submitSignedXdr(signedXdr);
      
      await recordRelease(dealId, milestone.id - 1, tx_hash);
      setTxStatus(`Released. Hash: ${tx_hash.substring(0, 8)}...`);
      await fetchBalances();
    } catch (err) {
      setTxStatus(err.message || 'Release failed');
    } finally {
      setLoadingId(null);
    }
  };

  const completedCount = milestones.filter(m => m.status === 'Completed').length;
  const progressPercent = milestones.length ? (completedCount / milestones.length) * 100 : 0;

  if (loadingData) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen bg-ink-900 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-aqua/20 border-t-aqua animate-spin" />
        <p className="mt-4 text-slate font-mono text-[10px] uppercase tracking-widest">Synchronizing Ledger...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-ink-900 flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-aqua/5 blur-[120px] rounded-full -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full space-y-10"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
          <div className="space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aqua/10 border border-aqua/20 text-[9px] font-mono uppercase tracking-[0.2em] text-aqua">
                <ShieldCheck size={12} /> On-Chain Escrow
             </div>
             <h1 className="text-4xl lg:text-5xl font-display font-bold text-white italic uppercase tracking-tight">{dealTitle}</h1>
          </div>
          <div className="flex gap-8 border-l border-white/10 pl-8 h-fit">
             <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate tracking-widest block">Total Allocation</span>
                <span className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-1">
                  <Coins size={16} className="text-aqua" /> {totalPrice} XLM
                </span>
             </div>
          </div>
        </div>

        <div className="bg-ink-800/50 border border-white/5 p-8 rounded-[2rem] space-y-6 backdrop-blur-sm">
           <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.2em] text-slate">
              <span>Settlement Progress</span>
              <span className="text-white">{Math.round(progressPercent)}%</span>
           </div>
           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-aqua to-blush shadow-[0_0_20px_rgba(94,240,255,0.4)]"
              />
           </div>
           <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-slate/50 italic">
              <Clock size={12} /> Active Life Cycle: Protocol State Synchronized
           </div>
        </div>

        <div className="space-y-6">
           <h2 className="text-sm font-bold text-slate uppercase tracking-[0.3em] font-mono flex items-center gap-3">
              <CheckCircle2 size={16} className="text-aqua" /> Sequence Milestones
           </h2>

           <div className="space-y-4">
              {milestones.map((m, i) => (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-6 rounded-[2rem] border transition-all duration-300 ${
                    m.status === 'Completed' 
                    ? 'bg-lime/5 border-lime/20' 
                    : m.status === 'In Progress' 
                    ? 'bg-ink-800/80 border-aqua/30' 
                    : 'bg-ink-800/20 border-white/5 opacity-40'
                  }`}
                >
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-center gap-5">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${m.status === 'Completed' ? 'bg-lime/10 border-lime/20 text-lime' : 'bg-white/5 border-white/10 text-slate'}`}>
                            {m.status === 'Completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                         </div>
                         <div>
                            <h3 className={`text-lg font-bold transition-colors font-display italic ${m.status === 'Completed' ? 'text-white' : 'text-slate'}`}>{m.task}</h3>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-slate/50 flex items-center gap-1 mt-1">
                              <Coins size={10} /> {m.amount} XLM
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        {m.status === 'In Progress' ? (
                          isBuyer ? (
                            <button 
                              onClick={() => handleRelease(m)}
                              disabled={loadingId === m.id}
                              className="w-full md:w-auto px-8 py-3 bg-white text-ink-900 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                            >
                               {loadingId === m.id ? 'Processing...' : 'Authorize Release'} <ArrowRight size={14} />
                            </button>
                          ) : (
                            <div className="text-[10px] font-mono text-aqua uppercase italic flex items-center gap-2 px-4 py-2 bg-aqua/5 rounded-lg border border-aqua/10">
                              <AlertCircle size={12} /> Awaiting Peer Authorization
                            </div>
                          )
                        ) : m.status === 'Pending' ? (
                          <div className="text-[9px] font-mono text-slate/40 uppercase tracking-widest flex items-center gap-2 px-4">
                             <Clock size={12} /> Sequential Lock
                          </div>
                        ) : (
                          <div className="px-5 py-2.5 rounded-xl bg-lime/10 text-lime text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-lime/20">
                             <CheckCircle2 size={12} /> Verified On-Chain
                          </div>
                        )}
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>
        </div>

        {txStatus && (
          <div className="text-[10px] font-mono text-aqua uppercase tracking-widest text-center animate-pulse">{txStatus}</div>
        )}

        <AnimatePresence>
        {completedCount === milestones.length && milestones.length > 0 && (
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="p-10 rounded-[3rem] bg-gradient-to-r from-aqua/20 to-blush/20 border border-aqua/40 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
             >
                <div className="space-y-2 relative z-10 text-center md:text-left">
                   <h3 className="text-2xl font-bold text-white font-display italic uppercase">Protocol Objective Fulfilled</h3>
                   <p className="text-slate text-[10px] font-mono uppercase tracking-[0.2em]">Deployment complete • Ledger state finalized</p>
                </div>
                {isBuyer ? (
                  <button 
                    onClick={async () => {
                      try {
                        await completeDeal(dealId);
                        navigate('/dashboard');
                      } catch (err) {
                        setTxStatus('Finalization Failed');
                      }
                    }}
                    className="px-12 py-5 bg-white text-ink-900 font-bold rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3 z-10 uppercase tracking-widest text-xs"
                  >
                     Close Lifecycle <ArrowRight size={20} />
                  </button>
                ) : (
                  <div className="text-[10px] font-mono text-slate uppercase tracking-widest bg-white/5 px-6 py-3 rounded-xl border border-white/10">
                    Awaiting peer to close lifecycle
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
