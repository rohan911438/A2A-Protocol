import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Clock, CheckCircle2, Circle, ArrowRight, AlertCircle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { walletService } from '../services/AlgorandWalletService';
import { getContractInfo, getReleaseTxn, submitSignedTxns } from '../services/ContractService';
import { getDeal, recordRelease, completeDeal } from '../services/DealService';

const ActiveDeal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dealId = location.state?.dealId || null;
  const { account, connected } = useWallet();
  const [milestones, setMilestones] = useState([]);
  const [contractInfo, setContractInfo] = useState(null);
  const [dealRecord, setDealRecord] = useState(null);
  const [txStatus, setTxStatus] = useState('');
  const [loadingData, setLoadingData] = useState(true);

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
    const timer = setInterval(fetchDeal, 4000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [dealId]);

  useEffect(() => {
    const tasks = ["Milestone 1", "Milestone 2", "Milestone 3"];
    const result = dealRecord?.data?.result || {};
    const finalPrice = result.final_price || 0;
    const milestoneAmounts = result.milestones?.length
      ? result.milestones
      : finalPrice
        ? [Math.round(finalPrice * 0.4), Math.max(finalPrice - Math.round(finalPrice * 0.4), 0)].filter((v) => v > 0)
        : contractInfo?.milestones || [150, 230];

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
        task: tasks[idx] || `Milestone ${idx + 1}`,
        status,
        amount: amt,
      };
    });
    setMilestones(mapped);
  }, [dealRecord, contractInfo]);

  const dealTitle = useMemo(() => {
    const request = dealRecord?.data?.request || dealRecord?.data || {};
    return request?.title || request?.description?.split('—')[0]?.trim() || 'Active Deal';
  }, [dealRecord]);

  const totalPrice = useMemo(() => {
    const result = dealRecord?.data?.result || {};
    return result.final_price || contractInfo?.total || 0;
  }, [dealRecord, contractInfo]);

  const sellerWalletRaw = useMemo(() => {
    return dealRecord?.data?.seller_wallet || '';
  }, [dealRecord]);

  const sellerWallet = useMemo(() => {
    return sellerWalletRaw.toLowerCase();
  }, [sellerWalletRaw]);

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
      setTxStatus('Connect a wallet to release on-chain.');
      return;
    }
    setLoadingId(milestone.id);
    setTxStatus('Preparing release transaction...');
    try {
      const { txn } = await getReleaseTxn(account, dealId, milestone.id - 1, sellerWalletRaw);
      const signed = await walletService.signTransactions(txn, 'TestNet');
      const { txids } = await submitSignedTxns(signed);
      await recordRelease(dealId, milestone.id - 1, txids[0]);
      setTxStatus(`Released on-chain. TxID: ${txids[0]}`);
      setMilestones((prev) =>
        prev.map((m) => {
          if (m.id === milestone.id) return { ...m, status: 'Completed' };
          if (m.id === milestone.id + 1 && m.status === 'Pending') {
            return { ...m, status: 'In Progress' };
          }
          return m;
        })
      );
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
        <p className="mt-4 text-slate font-mono text-xs uppercase tracking-widest">Loading escrow data...</p>
      </div>
    );
  }

  if (!dealId || !dealRecord) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen bg-ink-900 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
           <ShieldCheck size={40} className="text-slate/20" />
        </div>
        <h1 className="text-3xl font-display font-bold text-white italic">No Escrow Found</h1>
        <p className="text-slate text-sm max-w-xs mx-auto">Please select an active deal from your dashboard to track its milestones and release payments.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-8 py-3 bg-white text-ink-900 font-bold rounded-xl hover:scale-105 transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-ink-900 flex flex-col items-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-aqua/5 blur-[120px] rounded-full -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full space-y-10"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aqua/10 border border-aqua/20 text-[10px] font-mono uppercase tracking-[0.2em] text-aqua">
                <ShieldCheck size={12} /> Escrow Active
             </div>
             <h1 className="text-4xl lg:text-5xl font-display font-bold text-white italic">{dealTitle}</h1>
          </div>
          <div className="flex gap-8 border-l border-white/10 pl-8 h-fit">
             <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate tracking-widest block">Total Price</span>
                <span className="text-xl font-bold text-white uppercase tracking-tight italic">₹{totalPrice || 0}</span>
             </div>
             <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate tracking-widest block">Remaining</span>
                <span className="text-xl font-bold text-aqua uppercase tracking-tight italic">₹{totalPrice || 0}</span>
             </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="bg-ink-800/50 border border-white/5 p-8 rounded-[2rem] space-y-6">
           <div className="flex justify-between items-center text-xs font-mono uppercase tracking-widest text-slate">
              <span>Overall Progress</span>
              <span className="text-white">{Math.round(progressPercent)}%</span>
           </div>
           <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-aqua to-blush shadow-[0_0_15px_rgba(94,240,255,0.4)]"
              />
           </div>
           <div className="flex items-center gap-2 text-[10px] text-slate/60 italic">
              <Clock size={12} /> Est. Delivery: Apr 15, 2026 (7 days remaining)
           </div>
        </div>

        {/* Milestones Section */}
        <div className="space-y-6">
           <h2 className="text-xl font-bold text-white font-display flex items-center gap-3 italic">
              <CheckCircle2 size={24} className="text-aqua" /> Project Milestones
           </h2>

           <div className="space-y-4">
              {milestones.map((m, i) => (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-6 rounded-3xl border transition-all duration-300 ${
                    m.status === 'Completed' 
                    ? 'bg-lime/5 border-lime/20' 
                    : m.status === 'In Progress' 
                    ? 'bg-ink-800/80 border-white/10 active-shadow' 
                    : 'bg-ink-800/40 border-white/5 opacity-60'
                  }`}
                >
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-2xl ${m.status === 'Completed' ? 'bg-lime/10 text-lime' : 'bg-white/5 text-slate'}`}>
                            {m.status === 'Completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                         </div>
                         <div>
                            <h3 className={`font-bold transition-colors ${m.status === 'Completed' ? 'text-white' : 'text-slate'}`}>{m.task}</h3>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-slate/50">Release: ₹{m.amount}.00</div>
                         </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        {m.status === 'In Progress' ? (
                          isBuyer ? (
                            <button 
                              onClick={() => handleRelease(m)}
                              disabled={loadingId === m.id}
                              className="flex-1 md:flex-none px-6 py-2.5 bg-white text-ink-900 text-xs font-bold rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                            >
                               Approve & Release <CheckCircle2 size={14} />
                            </button>
                          ) : (
                            <div className="text-[10px] font-mono text-slate uppercase italic flex items-center gap-1.5 opacity-60 px-4">
                              <AlertCircle size={12} /> Waiting for buyer approval
                            </div>
                          )
                        ) : m.status === 'Pending' ? (
                          <div className="text-[10px] font-mono text-slate uppercase italic flex items-center gap-1.5 opacity-50 px-4">
                             <AlertCircle size={12} /> Locked until previous stage
                          </div>
                        ) : (
                          <div className="px-4 py-2 rounded-lg bg-lime/10 text-lime text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
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
          <div className="text-xs text-slate text-center">{txStatus}</div>
        )}

        {/* Final CTA if all done */}
        <AnimatePresence>
        {completedCount === milestones.length && milestones.length > 0 && (
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="p-8 rounded-[2.5rem] bg-gradient-to-r from-aqua/10 to-blush/10 border border-aqua/30 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group"
             >
                <div className="absolute top-0 right-0 w-32 h-32 bg-aqua/10 blur-[60px] rounded-full animate-pulse" />
                <div className="space-y-1">
                   <h3 className="text-xl font-bold text-white font-display italic">All Milestones Fulfilled!</h3>
                   <p className="text-slate text-xs italic">Review the final audit before completing the lifecycle.</p>
                </div>
                {isBuyer ? (
                  <button 
                    onClick={async () => {
                      try {
                        await completeDeal(dealId);
                      } catch (err) {
                        setTxStatus(err.message || 'Failed to finalize deal');
                        return;
                      }
                      navigate('/completion', { state: { dealId } });
                    }}
                    className="px-10 py-4 bg-white text-ink-900 font-bold rounded-2xl hover:scale-105 transition-all shadow-soft flex items-center justify-center gap-2 z-10"
                  >
                     Finalize Deal <ArrowRight size={20} />
                  </button>
                ) : (
                  <div className="text-xs font-mono text-slate uppercase italic">
                    Waiting for buyer to finalize
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
