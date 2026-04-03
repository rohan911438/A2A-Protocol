import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, ListChecks, ArrowRight, ShieldCheck } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { walletService } from '../services/AlgorandWalletService';
import { getCreateDealTxn, getAcceptTxnForDeal, getContractInfo, getDepositTxns, submitSignedTxns } from '../services/ContractService';
import { getDeal, approveDeal, rejectDeal, recordOnchainAccept, fundDeal } from '../services/DealService';

const DealSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, connected } = useWallet();
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
  const buyerWallet = requestData?.buyer_wallet || '';
  const sellerWallet = dealRecord?.data?.seller_wallet || '';
  const bothApproved = approvals.buyer && approvals.seller;
  const readyForActive = funded && onchainAccepts.buyer && onchainAccepts.seller;
  const isCompleted = (dealRecord?.status || '').toLowerCase() === 'completed';

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
    task: `Milestone ${idx + 1}`,
    amount: amt
  })), [computedMilestones]);

  useEffect(() => {
    getContractInfo()
      .then(setContractInfo)
      .catch(() => {});
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
    const id = setInterval(() => setRefreshTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  // Enhanced role detection supporting multiple data formats
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

  const handleAccept = async () => {
    if (!connected || !account) {
      setTxStatus('⚠️ Connect your wallet to accept on-chain.');
      return;
    }
    setLoading(true);
    setTxStatus('🔄 Preparing on-chain agreement...');
    try {
      if (!dealId) return;
      
      if (isSeller) {
        if (!onchainAccepts.buyer) {
          setTxStatus('⏳ Waiting for buyer to initiate the escrow on-chain.');
          setLoading(false);
          return;
        }
        setTxStatus('📝 Requesting signature for Seller Acceptance...');
        await approveDeal(dealId, 'seller');
        const { txn } = await getAcceptTxnForDeal(account, dealId);
        const signed = await walletService.signTransactions(txn, 'TestNet');
        setTxStatus('🚀 Submitting acceptance to Algorand...');
        const { txids } = await submitSignedTxns(signed);
        await recordOnchainAccept(dealId, 'seller', txids[0]);
        setTxStatus('✅ Accepted successfully!');
      } else if (isBuyer) {
        if (approvals.buyer && onchainAccepts.buyer) {
          setTxStatus('⚡ Escrow already created. Proceeding to funding...');
        } else {
          setTxStatus('📝 Requesting signature to create Escrow...');
          await approveDeal(dealId, 'buyer');
          const amount = Math.max(Math.round(finalPrice || 0), 0);
          const milestoneValues = computedMilestones.length ? computedMilestones : [amount];
          const { txns } = await getCreateDealTxn(account, dealId, amount, milestoneValues);
          const signed = await walletService.signTransactions(txns, 'TestNet');
          setTxStatus('🚀 Deploying Smart Contract to Algorand...');
          const { txids } = await submitSignedTxns(signed);
          await recordOnchainAccept(dealId, 'buyer', txids[0]);
        }

        // Try to fund if not funded yet
        if (!funded) {
          setTxStatus('💰 Creating Escrow funded! Requesting deposit signature...');
          const amount = Math.max(Math.round(finalPrice || 0), 0);
          const { txns: depTxns } = await getDepositTxns(account, dealId, amount);
          const signedDep = await walletService.signTransactions(depTxns, 'TestNet');
          setTxStatus('📡 Funding escrow on-chain...');
          const { txids: depIds } = await submitSignedTxns(signedDep);
          await fundDeal(dealId, depIds[0]);
          setTxStatus('✅ Escrow created and funded!');
        }
      } else {
        setTxStatus('❌ Unauthorized: Only the buyer or seller can accept this deal.');
      }
      
      // Final data refresh
      const updated = await getDeal(dealId);
      setDealRecord(updated);
      if (updated.data.funded && updated.data.onchain_accepts.buyer && updated.data.onchain_accepts.seller) {
        setTimeout(() => navigate('/active-deal', { state: { dealId } }), 2000);
      }
    } catch (err) {
      console.error('Acceptance error:', err);
      setTxStatus(`❌ Error: ${err.message || 'Transaction failed. Check console for details.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFund = async () => {
    if (!connected || !account) {
      setTxStatus('Connect a wallet to fund escrow.');
      return;
    }
      if (!bothApproved) {
        setTxStatus('Both parties must accept before funding.');
        return;
      }
      if (!isBuyer) {
        setTxStatus('Only buyer can fund escrow.');
        return;
      }
    setLoading(true);
    setTxStatus('Preparing deposit transaction...');
    try {
      const amount = Math.max(Math.round(finalPrice || 0), 0);
      if (!amount) {
        setTxStatus('Final price is missing. Cannot fund escrow.');
        setLoading(false);
        return;
      }
      const { txns } = await getDepositTxns(account, dealId, amount);
      const signed = await walletService.signTransactions(txns, 'TestNet');
      const { txids } = await submitSignedTxns(signed);
      await fundDeal(dealId, txids[0]);
      await getDeal(dealId).then(setDealRecord).catch(() => {});
      setTxStatus(`Escrow funded. TxID: ${txids[0]}`);
      if (readyForActive) {
        navigate('/active-deal', { state: { dealId } });
      }
    } catch (err) {
      setTxStatus(err.message || 'Deposit failed');
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
        <p className="mt-4 text-slate font-mono text-xs uppercase tracking-widest">Loading deal data...</p>
      </div>
    );
  }

  if (!dealId || !dealRecord) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen bg-ink-900 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
           <ShieldCheck size={40} className="text-slate/20" />
        </div>
        <h1 className="text-3xl font-display font-bold text-white italic">No Deal Selected</h1>
        <p className="text-slate text-sm max-w-xs mx-auto">Please select a deal from your dashboard to view its summary and escrow status.</p>
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
    <div className="pt-32 pb-20 px-6 min-h-screen bg-ink-900 flex flex-col items-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-aqua/5 to-transparent -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full space-y-8"
      >
        <div className="text-center space-y-4">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime/10 border border-lime/20 text-[10px] font-mono uppercase tracking-[0.2em] text-lime">
              <CheckCircle size={12} /> Negotiation Successful
           </div>
           <h1 className="text-4xl lg:text-5xl font-display font-bold text-white italic">Deal Finalized</h1>
           <p className="text-slate text-sm">Please review the final agreement reached by your AI agents.</p>
        </div>

        {/* Summary Card */}
        <div className="bg-ink-800/50 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl shadow-soft space-y-8">
           
           {/* Price & Deadline Row */}
           <div className="grid grid-cols-2 gap-6 pb-8 border-b border-white/5">
              <div className="space-y-1">
                 <div className="text-[10px] uppercase font-mono text-slate tracking-widest flex items-center gap-1.5">
                    Final Price
                 </div>
                 <div className="text-4xl font-display font-bold text-white">
                    {finalPrice || 0} ALGO
                 </div>
              </div>
              <div className="space-y-1 text-right">
                 <div className="text-[10px] uppercase font-mono text-slate tracking-widest flex items-center justify-end gap-1.5">
                    <Calendar size={12} className="text-aqua" /> Deadline
                 </div>
                 <div className="text-xl font-bold text-white">
                    {requestData.deadline || "Apr 15, 2026"}
                 </div>
              </div>
           </div>

           {/* Milestones List */}
           <div className="space-y-5">
              <div className="flex items-center justify-between">
                 <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                    <ListChecks size={18} className="text-aqua" /> Milestones Breakout
                 </h3>
                 <span className="text-[10px] text-slate/50 font-mono tracking-tighter italic">{milestones.length} Total Stages</span>
              </div>

              <div className="space-y-3">
                 {milestones.map((m, i) => (
                   <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors">
                      <span className="text-sm text-slate group-hover:text-white transition-colors">{m.task}</span>
                      <span className="text-sm font-bold text-white font-mono">{m.amount} ALGO</span>
                   </div>
                 ))}
              </div>
           </div>

           {/* Trust Indicator */}
           <div className="p-4 rounded-2xl bg-aqua/5 border border-aqua/10 flex items-center gap-4">
              <ShieldCheck size={24} className="text-aqua shrink-0" />
              <div className="text-[10px] leading-relaxed text-slate italic">
                 Terms are verified and ready for deployment to the Algorand Smart Contract. Funds will be held in secure escrow.
              </div>
           </div>

           {/* Buttons */}
           <div className="pt-4 flex flex-col gap-3">
              {isCompleted ? (
                <button
                  onClick={() => navigate('/completion', { state: { dealId } })}
                  className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  View Completion
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleAccept}
                    disabled={loading || !(isBuyer || isSeller) || (isBuyer && onchainAccepts.buyer && funded) || (isSeller && onchainAccepts.seller)}
                    className="w-full py-5 bg-gradient-to-r from-aqua to-blush text-ink-900 font-bold rounded-2xl hover:scale-[1.02] transition-all shadow-soft flex items-center justify-center gap-2 group"
                  >
                     {isBuyer ? (onchainAccepts.buyer && funded ? 'Buyer Accepted' : 'Accept & Create Escrow') : (onchainAccepts.seller ? 'Seller Accepted' : 'Accept Offer')} <ArrowRight size={20} className="group-hover:translate-x-1" />
                  </button>
                  <button 
                    onClick={handleReject}
                    disabled={!dealId || !(isBuyer || isSeller)}
                    className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                     Reject Offer
                  </button>
                  {bothApproved && isBuyer && onchainAccepts.buyer && !funded && (
                    <button 
                      onClick={handleFund}
                      disabled={loading}
                      className="w-full py-4 bg-white text-ink-900 font-bold rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                       💰 Finalize Escrow Funding
                    </button>
                  )}
                  {funded && (
                    <button
                      onClick={() => navigate('/active-deal', { state: { dealId } })}
                      className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      View Active Deal
                    </button>
                  )}
                </>
              )}
              {txStatus && (
                <div className="text-xs text-slate text-center">{txStatus}</div>
              )}

           </div>

        </div>
      </motion.div>
    </div>
  );
};

export default DealSummary;
