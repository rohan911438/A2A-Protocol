import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, ArrowRight, AlertCircle, Coins, Activity, Lock, Loader2 } from 'lucide-react';
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
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDeal();
      }
    }, 12000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [dealId]);

  useEffect(() => {
    const defaultTasks = ["Milestone 1", "Milestone 2", "Milestone 3"];
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
    return request?.title || request?.description?.split('—')[0]?.trim() || 'Active deal';
  }, [dealRecord]);

  const totalPrice = useMemo(() => {
    const result = dealRecord?.data?.result || {};
    return result.final_price || 0;
  }, [dealRecord]);

  // Only trust a seller wallet the seller explicitly registered by accepting
  // the deal. Falling back to a hardcoded placeholder address here made
  // sellerWalletValid always true, so a buyer could release real funds to
  // that shared demo wallet before the actual seller ever connected theirs.
  const sellerWalletRaw = useMemo(() => {
    if (!dealRecord?.data?.seller_accepted) return '';
    const request = dealRecord?.data?.request || dealRecord?.data || {};
    return dealRecord?.data?.seller_wallet || request?.seller_wallet || '';
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
      setTxStatus('Connect your wallet to authorize a release.');
      return;
    }
    if (!isValidStellarAccount(account)) {
      setTxStatus('Invalid sender account. Reconnect your wallet and use a Stellar account (G...).');
      return;
    }
    if (!isValidStellarAccount(sellerWalletRaw)) {
      setTxStatus('Seller wallet is missing or invalid. Set the seller wallet before releasing funds.');
      return;
    }
    setLoadingId(milestone.id);
    setTxStatus('Building the release transaction...');
    try {
      const { xdr } = await getReleaseTxn(account, dealId, milestone.id - 1, milestone.amount, sellerWalletRaw);

      setTxStatus('Waiting for your signature...');
      const signedXdr = await signTransaction(xdr);

      setTxStatus('Submitting to Stellar...');
      const { tx_hash } = await submitSignedXdr(signedXdr);

      await recordRelease(dealId, milestone.id - 1, tx_hash);
      setTxStatus(`Released. Tx ${tx_hash.substring(0, 10)}...`);
      await fetchBalances();
    } catch (err) {
      setTxStatus(err.message || 'Signature failed');
    } finally {
      setLoadingId(null);
    }
  };

  const completedCount = milestones.filter(m => m.status === 'Completed').length;
  const progressPercent = milestones.length ? (completedCount / milestones.length) * 100 : 0;

  if (loadingData) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen bg-paper flex flex-col items-center justify-center">
        <Loader2 className="text-clay-400 animate-spin" size={32} />
        <p className="mt-5 text-bark-faint text-sm">Loading deal...</p>
      </div>
    );
  }

  if (!dealId) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen bg-paper flex flex-col items-center justify-center">
        <div className="max-w-xl w-full text-center space-y-6 paper-card p-12">
          <h2 className="text-2xl font-serif font-medium text-bark">No active deal selected</h2>
          <p className="text-bark-muted text-sm">Open this page from the Dashboard or a deal summary so a valid deal context is provided.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-clay"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen bg-paper relative">
      <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-clay-500/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto w-full space-y-10"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-line pb-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-moss-400/10 border border-moss-400/25 text-xs font-semibold text-moss-400">
              <ShieldCheck size={13} /> Escrow funded on-chain
            </div>
            <h1 className="text-3xl lg:text-4xl font-serif font-medium text-bark tracking-tight">{dealTitle}</h1>
          </div>
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-semibold text-bark-faint tracking-widest block">Total value</span>
            <span className="text-3xl font-serif font-medium text-bark flex items-center gap-2">
              {totalPrice} <span className="text-xs font-mono text-clay-400 uppercase tracking-wide">XLM</span>
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="paper-card p-8 space-y-5">
          <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-widest text-bark-faint">
            <span>Settlement progress</span>
            <span className="text-bark">{Math.round(progressPercent)}%</span>
          </div>

          <div className="h-2 w-full bg-surface-raised rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-clay-500 rounded-full"
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-6">
          <h2 className="text-xs font-semibold text-bark-faint uppercase tracking-[0.2em]">Milestones</h2>

          <div className="space-y-4">
            {milestones.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-7 rounded-2xl border transition-all duration-500 ${
                  m.status === 'Completed'
                  ? 'bg-moss-400/[0.04] border-moss-400/25'
                  : m.status === 'In Progress'
                  ? 'paper-card border-clay-500/30'
                  : 'bg-surface/40 border-line opacity-60'
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                        m.status === 'Completed'
                        ? 'bg-moss-400/10 border-moss-400/30 text-moss-400'
                        : m.status === 'In Progress'
                        ? 'bg-clay-500/10 border-clay-500/30 text-clay-400'
                        : 'bg-surface border-line text-bark-faint'
                    }`}>
                      {m.status === 'Completed' ? <CheckCircle2 size={22} /> : m.status === 'In Progress' ? <Activity size={22} /> : <Lock size={20} />}
                    </div>
                    <div className="space-y-1">
                      <h3 className={`text-lg font-semibold ${m.status === 'Pending' ? 'text-bark-muted' : 'text-bark'}`}>{m.task}</h3>
                      <div className="text-sm font-mono text-clay-400 flex items-center gap-2">
                        <Coins size={13} /> {m.amount} XLM
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {m.status === 'In Progress' ? (
                      isBuyer ? (
                        <button
                          onClick={() => handleRelease(m)}
                          disabled={loadingId === m.id}
                          className="w-full md:w-auto btn-clay text-sm py-3 flex items-center justify-center gap-2"
                        >
                          {loadingId === m.id ? 'Releasing...' : 'Release payment'}
                          {loadingId !== m.id && <ArrowRight size={15} />}
                        </button>
                      ) : (
                        <div className="text-xs font-semibold text-bark-faint flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-line">
                          <AlertCircle size={14} /> Waiting on buyer
                        </div>
                      )
                    ) : m.status === 'Pending' ? (
                      <div className="text-xs font-semibold text-bark-faint flex items-center gap-2 px-2">
                        <Lock size={14} /> Locked
                      </div>
                    ) : (
                      <div className="px-4 py-2.5 rounded-xl bg-moss-400/10 text-moss-400 text-xs font-semibold flex items-center gap-2 border border-moss-400/25">
                        <CheckCircle2 size={14} /> Released
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {isBuyer && (!senderWalletValid || !sellerWalletValid) && (
            <div className="text-sm font-medium text-clay-400 bg-clay-500/10 border border-clay-500/25 rounded-xl px-5 py-3.5">
              {senderWalletValid
                ? 'Seller wallet is not set yet. Ask the seller to accept the deal before you release funds.'
                : 'Your wallet is invalid. Reconnect and select a Stellar account (G...).'}
            </div>
          )}
        </div>

        <AnimatePresence>
          {txStatus && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium text-bark-muted text-center bg-surface py-4 rounded-xl border border-line"
            >
              {txStatus}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {completedCount === milestones.length && milestones.length > 0 && (
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="paper-card p-10 flex flex-col md:flex-row items-center justify-between gap-8 border-clay-500/25"
            >
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-serif font-medium text-bark">All milestones released</h3>
                <div className="text-sm text-bark-muted">Ready to close out this deal.</div>
              </div>
              {isBuyer ? (
                <button
                  onClick={async () => {
                    try {
                      await completeDeal(dealId);
                      navigate('/dashboard');
                    } catch (err) {
                      setTxStatus(err.message || 'Could not close out the deal');
                    }
                  }}
                  className="btn-clay flex items-center gap-2 shrink-0"
                >
                  Mark deal complete <ArrowRight size={16} />
                </button>
              ) : (
                <div className="text-sm font-medium text-bark-faint bg-surface px-6 py-3.5 rounded-xl border border-line shrink-0">
                  Waiting for the buyer to close out
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
