import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Calendar, ListChecks, ArrowRight, ShieldCheck, Coins, Database, Activity, Terminal, Shield, Zap } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { getCreateDealTxn, getContractInfo, submitSignedXdr } from '../services/ContractService';
import { getDeal, approveDeal, rejectDeal, recordOnchainAccept, fundDeal } from '../services/DealService';

const DealSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, connected, signTransaction, fetchBalances } = useWallet();
  const [contractInfo, setContractInfo] = useState(null);
  const [txStatus, setTxStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  
  const dealId = location.state?.dealId || null;
  const [dealRecord, setDealRecord] = useState(null);

  const requestData = dealRecord?.data?.request || dealRecord?.data || location.state || {};
  const finalPrice = dealRecord?.data?.result?.final_price || 0;
  const approvals = dealRecord?.data?.approvals || { buyer: false, seller: false };
  const onchainAccepts = dealRecord?.data?.onchain_accepts || { buyer: false, seller: false };
  const funded = Boolean(dealRecord?.data?.funded);
  const existsOnChain = onchainAccepts.buyer || onchainAccepts.seller;

  const computedMilestones = useMemo(() => {
    if (dealRecord?.data?.result?.milestones?.length) return dealRecord.data.result.milestones;
    if (finalPrice > 0) {
      const first = Math.round(finalPrice * 0.4);
      const second = Math.max(finalPrice - first, 0);
      return [first, second].filter((v) => v > 0);
    }
    return [];
  }, [dealRecord, finalPrice]);

  const milestones = useMemo(() => computedMilestones.map((amt, idx) => ({
    task: `Phase ${idx + 1}`,
    amount: amt
  })), [computedMilestones]);

  useEffect(() => {
    getContractInfo().then(setContractInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (!dealId) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    getDeal(dealId)
      .then((res) => {
        setDealRecord(res);
        setLoadingData(false);
      })
      .catch(() => {
        setLoadingData(false);
      });
  }, [dealId, refreshTick]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setRefreshTick((t) => t + 1);
      }
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const buyerAddress = requestData?.buyer_wallet || dealRecord?.data?.buyer_wallet || '';
  const sellerAddress = dealRecord?.data?.seller_wallet || requestData?.seller_wallet || '';

  const userRole = useMemo(() => {
    if (!account) return null;
    const current = account.toLowerCase();
    const b = buyerAddress ? buyerAddress.toLowerCase() : '';
    const s = sellerAddress ? sellerAddress.toLowerCase() : '';

    if (b && current === b) return 'buyer';
    if (s && current === s) return 'seller';

    // Fallback for flows where seller wallet was not persisted yet.
    if (b && current !== b) return 'seller';
    return null;
  }, [account, buyerAddress, sellerAddress]);

  const isBuyer = userRole === 'buyer';
  const isSeller = userRole === 'seller';

  const handleAuthorize = async () => {
    if (!connected || !account) {
      setTxStatus('Connect wallet to authorize protocol.');
      return;
    }
    if (!/^G[A-Z2-7]{55}$/.test(account)) {
      setTxStatus('Invalid wallet account selected. Reconnect wallet and choose a Stellar account (G...).');
      return;
    }
    setLoading(true);
    setTxStatus('Initializing A2A Protocol sequence...');
    try {
      if (!dealId) return;
      if (!userRole) {
        setTxStatus('Unable to resolve your role for this deal. Reopen from dashboard after connecting wallet.');
        return;
      }
      
      if (userRole === 'buyer') {
        setTxStatus('Generating Stellar Escrow XDR...');
        await approveDeal(dealId, 'buyer');
        const amount = Math.max(Math.round(finalPrice || 0), 0);
        const milestoneValues = [amount]; 
        
        const { xdr } = await getCreateDealTxn(account, dealId, amount, milestoneValues);
        const signedXdr = await signTransaction(xdr);
        
        setTxStatus('Submitting to Stellar network...');
        const { tx_hash } = await submitSignedXdr(signedXdr);
        
        await recordOnchainAccept(dealId, 'buyer', tx_hash);
        await fundDeal(dealId, tx_hash);
        setTxStatus('Escrow initialized and funded!');
        await fetchBalances();
      } else if (userRole === 'seller') {
        await approveDeal(dealId, 'seller');
        setTxStatus('Offer authorized. Waiting for buyer settlement.');
      }
      
      setRefreshTick(t => t + 1);
    } catch (err) {
      setTxStatus(`Error: ${err.message || 'Protocol failure.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!dealId || !userRole) return;
    const role = userRole;
    await rejectDeal(dealId, role);
    navigate('/dashboard');
  };

  if (loadingData) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl border-2 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center">
            <Database className="text-indigo-400" size={24} />
        </div>
        <p className="mt-6 text-mist/60 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">Compiling Neural Agreement...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen flex flex-col items-center relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-12 z-10"
      >
        <div className="text-center space-y-6">
           <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
              <CheckCircle size={14} /> Autonomous Consensus Verified
           </div>
           <h1 className="text-6xl font-display font-black text-white uppercase tracking-tighter leading-none">
             Agreement <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-stellar-cyan">Synthesis</span>
           </h1>
           <div className="flex items-center justify-center gap-4 text-[9px] font-mono font-bold text-slate uppercase tracking-[0.4em] opacity-40">
                <span>Protocol: {dealId?.substring(0, 8)}</span>
                <div className="w-1 h-1 rounded-full bg-indigo-500/50" />
                <span>Verified Snapshot</span>
           </div>
        </div>

        <div className="glass-morphism border border-white/10 rounded-[3.5rem] p-12 backdrop-blur-3xl shadow-2xl space-y-12 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -z-10 group-hover:bg-indigo-500/10 transition-colors duration-1000" />
           
           <div className="grid grid-cols-2 gap-12 pb-12 border-b border-white/5">
              <div className="space-y-4">
                 <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Activity size={12} /> Established Rate
                 </div>
                 <div className="text-5xl font-display font-black text-white flex items-end gap-2 tracking-tighter">
                    {finalPrice || 0} <span className="text-xs font-mono mb-2 text-slate font-bold uppercase tracking-widest opacity-60">XLM</span>
                 </div>
              </div>
              <div className="space-y-4 text-right">
                 <div className="text-[10px] font-black text-stellar-cyan uppercase tracking-[0.3em] flex items-center justify-end gap-2">
                    Settlement <Calendar size={12} />
                 </div>
                 <div className="text-2xl font-bold text-white uppercase tracking-tighter italic">
                    {requestData.deadline || "AD-HOC"}
                 </div>
              </div>
           </div>

           <div className="space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-4">
                    <ListChecks size={20} className="text-indigo-500" /> 
                    <span>Logic Sequence</span>
                    <div className="flex-grow h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
                 </h3>
              </div>

              <div className="space-y-4 relative">
                 {milestones.map((m, i) => (
                   <div key={i} className="flex items-center justify-between p-7 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all hover:bg-white/[0.05] group">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-xl bg-ink-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-indigo-400 group-hover:border-indigo-500/50 transition-all">{i+1}</div>
                        <div>
                            <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{m.task}</div>
                            <div className="text-[9px] font-bold text-slate uppercase tracking-widest opacity-40">Protocol Phase</div>
                        </div>
                      </div>
                      <div className="text-lg font-mono font-black text-white flex items-center gap-2">
                        <Coins size={16} className="text-stellar-cyan/40" /> {m.amount}
                      </div>
                   </div>
                 ))}
                 
                 {/* Decorative vertical line */}
                 <div className="absolute top-10 bottom-10 left-[2.25rem] w-px bg-indigo-500/10 -z-10" />
              </div>
           </div>

           <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-6 group hover:border-indigo-500/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={28} className="text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Protocol Integrity Mask</div>
                <div className="text-xs leading-relaxed text-slate font-medium opacity-70">
                   Immutable agreement metadata secured via Stellar XDR. Terms are cryptographically locked until milestone verification logic returns success.
                </div>
              </div>
           </div>

           <div className="space-y-5">
              {funded ? (
                <button
                  onClick={() => navigate('/active-deal', { state: { dealId } })}
                  className="w-full py-6 bg-white text-ink-900 font-black rounded-3xl hover:scale-[1.02] transition-all shadow-glow flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs"
                >
                  Enter Active Node <ArrowRight size={20} />
                </button>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={handleAuthorize}
                    disabled={loading || !userRole || (isSeller && approvals.seller) || (isBuyer && existsOnChain)}
                    className="w-full py-6 bg-gradient-to-r from-indigo-500 via-purple-600 to-stellar-cyan text-white font-black rounded-3xl hover:scale-[1.02] transition-all shadow-glow flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs relative overflow-hidden group/btn"
                  >
                     <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                     {isBuyer ? (existsOnChain ? 'Escrow Online' : 'Authorize Escrow Logic') : (approvals.seller ? 'Ready for Sync' : 'Authorize Proposal')} 
                     <Zap size={20} className="relative z-10" />
                  </button>
                  <button 
                    onClick={handleReject}
                    disabled={loading || !dealId || !userRole}
                    className="w-full py-4 bg-white/5 border border-white/10 text-slate font-black rounded-3xl hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/20 transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.3em]"
                  >
                     Terminate Protocol
                  </button>
                </div>
              )}
              
              <AnimatePresence>
                {txStatus && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-mono font-bold text-stellar-cyan uppercase tracking-[0.3em] text-center bg-stellar-cyan/5 py-4 rounded-2xl border border-stellar-cyan/10">
                        <Terminal size={14} className="inline-block mr-3" /> {txStatus}
                    </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DealSummary;
