import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, ListChecks, ArrowRight, ShieldCheck, Coins } from 'lucide-react';
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
    const id = setInterval(() => setRefreshTick((t) => t + 1), 8000);
    return () => clearInterval(id);
  }, []);

  const isBuyer = useMemo(() => {
    if (!account) return false;
    const bAddr = requestData?.buyer_wallet || dealRecord?.data?.buyer_wallet;
    return bAddr && account.toLowerCase() === bAddr.toLowerCase();
  }, [account, requestData, dealRecord]);

  const isSeller = useMemo(() => {
    if (!account) return false;
    const sAddr = dealRecord?.data?.seller_wallet || requestData?.seller_wallet;
    return sAddr && account.toLowerCase() === sAddr.toLowerCase();
  }, [account, dealRecord, requestData]);

  const handleAuthorize = async () => {
    if (!connected || !account) {
      setTxStatus('Connect wallet to authorize protocol.');
      return;
    }
    setLoading(true);
    setTxStatus('Initializing A2A Protocol sequence...');
    try {
      if (!dealId) return;
      
      if (isBuyer) {
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
      } else if (isSeller) {
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
    if (!dealId || !(isBuyer || isSeller)) return;
    const role = isBuyer ? 'buyer' : 'seller';
    await rejectDeal(dealId, role);
    navigate('/dashboard');
  };

  if (loadingData) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen bg-ink-900 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-aqua/20 border-t-aqua animate-spin" />
        <p className="mt-4 text-slate font-mono text-[10px] uppercase tracking-widest">Compiling Summary...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-ink-900 flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-aqua/5 to-transparent -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full space-y-12"
      >
        <div className="text-center space-y-4">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime/10 border border-lime/20 text-[9px] font-mono uppercase tracking-[0.2em] text-lime">
              <CheckCircle size={12} /> Autonomous Consensus Reached
           </div>
           <h1 className="text-5xl font-display font-bold text-white italic uppercase tracking-tighter">Agreement Meta</h1>
           <p className="text-slate text-[10px] font-mono uppercase tracking-widest mt-2">{dealId ? `Protocol ID: ${dealId.substring(0, 12)}...` : ''}</p>
        </div>

        <div className="bg-ink-800/50 border border-white/10 rounded-[3rem] p-10 backdrop-blur-2xl shadow-soft space-y-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-aqua/5 blur-[50px] -z-10" />
           
           <div className="grid grid-cols-2 gap-8 pb-10 border-b border-white/5">
              <div className="space-y-2">
                 <div className="text-[10px] uppercase font-mono text-slate/50 tracking-widest flex items-center gap-1.5 focus:text-aqua transition-colors">
                    Agreed Terms
                 </div>
                 <div className="text-4xl font-display font-bold text-white flex items-center gap-1">
                    <Coins size={24} className="text-aqua" /> {finalPrice || 0} <span className="text-xs font-mono ml-1 text-slate font-normal">XLM</span>
                 </div>
              </div>
              <div className="space-y-2 text-right">
                 <div className="text-[10px] uppercase font-mono text-slate/50 tracking-widest flex items-center justify-end gap-1.5 focus:text-aqua transition-colors">
                    <Calendar size={12} className="text-aqua" /> Settlement
                 </div>
                 <div className="text-xl font-bold text-white uppercase tracking-tighter italic">
                    {requestData.deadline || "TBD"}
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-xs font-bold text-slate uppercase tracking-[0.3em] font-mono flex items-center gap-3">
                    <ListChecks size={18} className="text-aqua" /> Sequence Breakdown
                 </h3>
              </div>

              <div className="space-y-4">
                 {milestones.map((m, i) => (
                   <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/10 transition-all hover:bg-white/[0.07]">
                      <span className="text-sm text-slate group-hover:text-white transition-colors flex items-center gap-3 font-medium">
                        <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-slate/40">{i+1}</span>
                        {m.task}
                      </span>
                      <span className="text-sm font-bold text-white font-mono flex items-center gap-1">
                        <Coins size={12} className="text-aqua/50" /> {m.amount} <span className="text-[9px] text-slate font-normal">XLM</span>
                      </span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="p-5 rounded-2xl bg-aqua/5 border border-aqua/10 flex items-start gap-4">
              <ShieldCheck size={24} className="text-aqua shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed text-slate/70 italic uppercase tracking-wider">
                 All terms are immutable once authorized. Funding will be secured by decentralized Stellar logic. Peer identities are verified via protocol hash.
              </div>
           </div>

           <div className="space-y-4">
              {funded ? (
                <button
                  onClick={() => navigate('/active-deal', { state: { dealId } })}
                  className="w-full py-5 bg-white text-ink-900 font-bold rounded-2xl hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                  Track Active Escrow <ArrowRight size={18} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleAuthorize}
                    disabled={loading || !(isBuyer || isSeller) || (isSeller && approvals.seller) || (isBuyer && existsOnChain)}
                    className="w-full py-5 bg-gradient-to-r from-aqua to-blush text-ink-900 font-bold rounded-2xl hover:scale-[1.02] transition-all shadow-soft flex items-center justify-center gap-3 uppercase tracking-widest text-xs group"
                  >
                     {isBuyer ? (existsOnChain ? 'Escrow Initialized' : 'Authorize & Set Escrow') : (approvals.seller ? 'Authorized' : 'Authorize Negotiation')} <ArrowRight size={18} className="group-hover:translate-x-1" />
                  </button>
                  <button 
                    onClick={handleReject}
                    disabled={loading || !dealId || !(isBuyer || isSeller)}
                    className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                  >
                     Decline Proposal
                  </button>
                </>
              )}
              
              {txStatus && (
                <div className="text-[9px] font-mono text-aqua/60 uppercase tracking-[0.2em] text-center bg-aqua/5 py-3 rounded-lg border border-aqua/10 animate-fadeInUp">
                  {txStatus}
                </div>
              )}
           </div>

        </div>
      </motion.div>
    </div>
  );
};

export default DealSummary;
