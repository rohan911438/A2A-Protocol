import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Calendar, ListChecks, ArrowRight, ShieldCheck, Coins, Loader2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { getCreateDealTxn, getContractInfo, submitSignedXdr } from '../services/ContractService';
import { getDeal, approveDeal, rejectDeal, recordOnchainAccept, fundDeal, getSmartDealSummary, getDealX402Status, recordDealX402Payment } from '../services/DealService';
import SmartDealSummary from '../components/SmartDealSummary';

const DealSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, connected, signTransaction, fetchBalances } = useWallet();
  const [contractInfo, setContractInfo] = useState(null);
  const [txStatus, setTxStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [smartSummary, setSmartSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [summaryConfirmed, setSummaryConfirmed] = useState(false);
  const [x402Status, setX402Status] = useState(null);
  const [paymentProof, setPaymentProof] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);

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
    task: `Stage ${idx + 1}`,
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
  const summaryWallet = buyerAddress || account || sellerAddress || '';

  const userRole = useMemo(() => {
    if (!account) return null;
    const current = account.toLowerCase();
    const b = buyerAddress ? buyerAddress.toLowerCase() : '';
    const s = sellerAddress ? sellerAddress.toLowerCase() : '';

    if (b && current === b) return 'buyer';
    if (s && current === s) return 'seller';

    // No persisted seller wallet yet and this isn't the buyer: don't grant
    // seller authority to whoever happens to load the page next. Doing so
    // let any third party who discovered the deal_id approve/reject a deal
    // that wasn't theirs. Leave the role unresolved until the seller has
    // actually accepted (which persists seller_wallet).
    return null;
  }, [account, buyerAddress, sellerAddress]);

  const isBuyer = userRole === 'buyer';
  const isSeller = userRole === 'seller';

  useEffect(() => {
    setSummaryConfirmed(false);
  }, [dealId, finalPrice]);

  useEffect(() => {
    if (!dealId || !summaryWallet) return;
    setSummaryLoading(true);
    setSummaryError('');
    getSmartDealSummary(dealId, summaryWallet)
      .then((res) => {
        setSmartSummary(res?.summary || null);
      })
      .catch((err) => {
        setSummaryError(err.message || 'Failed to load smart summary');
      })
      .finally(() => {
        setSummaryLoading(false);
      });
  }, [dealId, summaryWallet, refreshTick]);

  useEffect(() => {
    if (!dealId || !summaryWallet) return;
    getDealX402Status(dealId, summaryWallet)
      .then((res) => setX402Status(res))
      .catch((err) => {
        const payload = err?.payload?.detail || err?.payload || null;
        if (payload) {
          setX402Status(payload);
          return;
        }
        setX402Status({ status: 'authorized', purpose: 'simulation', amount: 0, recipient_wallet: sellerAddress, source: 'simulated' });
      });
  }, [dealId, summaryWallet, sellerAddress, refreshTick]);

  const handleAuthorize = async () => {
    if (!connected || !account) {
      setTxStatus('Connect your wallet to continue.');
      return;
    }
    if (!/^G[A-Z2-7]{55}$/.test(account)) {
      setTxStatus('Invalid wallet account selected. Reconnect and choose a Stellar account (G...).');
      return;
    }
    if (isBuyer && x402Status?.status !== 'authorized') {
      setTxStatus('Payment authorization is required before funding escrow.');
      return;
    }
    if (isBuyer && !summaryConfirmed) {
      setTxStatus('Confirm the smart deal summary before funding escrow.');
      return;
    }
    setLoading(true);
    setTxStatus('Preparing the escrow transaction...');
    try {
      if (!dealId) return;
      if (!userRole) {
        setTxStatus('Unable to resolve your role for this deal. Reopen from the dashboard after connecting your wallet.');
        return;
      }

      if (userRole === 'buyer') {
        setTxStatus('Building the escrow transaction...');
        await approveDeal(dealId, 'buyer');
        // Split into the same 40/60 milestone schedule ActiveDeal releases
        // against instead of recording a single lump-sum milestone, so the
        // on-chain create-txn record matches what's actually enforced
        // during release. `amount` is derived as the exact sum of the
        // milestones (rather than independently rounding finalPrice) so it
        // always satisfies the backend's sum-must-equal-total check.
        const storedMilestones = dealRecord?.data?.result?.milestones;
        const milestoneValues = storedMilestones?.length
          ? storedMilestones
          : (() => {
              const rounded = Math.max(Math.round(finalPrice || 0), 0);
              const first = Math.round(rounded * 0.4);
              const second = Math.max(rounded - first, 0);
              return second > 0 ? [first, second] : [first];
            })();
        const amount = milestoneValues.reduce((sum, v) => sum + Number(v), 0);

        const { xdr } = await getCreateDealTxn(account, dealId, amount, milestoneValues);
        const signedXdr = await signTransaction(xdr);

        setTxStatus('Submitting to Stellar...');
        const { tx_hash } = await submitSignedXdr(signedXdr);

        await recordOnchainAccept(dealId, 'buyer', tx_hash);
        await fundDeal(dealId, tx_hash);
        setTxStatus('Escrow funded.');
        await fetchBalances();
      } else if (userRole === 'seller') {
        await approveDeal(dealId, 'seller');
        setTxStatus('Offer accepted. Waiting for the buyer to fund escrow.');
      }

      setRefreshTick(t => t + 1);
    } catch (err) {
      const payload = err?.payload?.detail || err?.payload || null;
      if (payload) {
        setX402Status(payload);
      }
      setTxStatus(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!dealId || !summaryWallet) {
      setSummaryError('Missing deal or wallet context for payment verification.');
      return;
    }
    setVerifyingPayment(true);
    setX402Status((current) => ({ ...(current || {}), status: 'verifying_payment' }));
    try {
      const result = await recordDealX402Payment(dealId, {
        wallet_address: summaryWallet,
        purpose: 'escrow_authorization_fee',
        tx_hash: paymentProof.trim() || undefined,
        confirm_local: !paymentProof.trim(),
      });
      setX402Status({
        status: result.status === 'verified' ? 'authorized' : 'payment_required',
        purpose: result.purpose,
        amount: result.amount,
        currency: 'XLM',
        recipient_wallet: result.recipient_wallet,
        wallet_address: result.wallet_address,
        deal_id: result.deal_id,
        tx_hash: result.tx_hash,
        source: result.source,
        verified_at: result.verified_at,
      });
      if (result.status === 'verified') {
        setSummaryConfirmed(true);
        setTxStatus('Payment authorized. You can now fund escrow.');
      } else {
        setTxStatus('Recorded. Verification still pending.');
      }
      setRefreshTick((t) => t + 1);
    } catch (err) {
      const payload = err?.payload?.detail || err?.payload || null;
      if (payload) {
        setX402Status(payload);
      }
      setTxStatus(err.message || 'Unable to verify payment authorization.');
    } finally {
      setVerifyingPayment(false);
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
      <div className="pt-32 pb-20 px-6 min-h-screen bg-paper flex flex-col items-center justify-center">
        <Loader2 className="text-clay-400 animate-spin" size={32} />
        <p className="mt-5 text-bark-faint text-sm">Loading agreement...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen bg-paper relative">
      <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-clay-500/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto w-full space-y-10"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-moss-400/10 border border-moss-400/25 text-xs font-semibold text-moss-400">
            <CheckCircle size={13} /> Agreement reached
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-medium text-bark tracking-tight">Deal summary</h1>
          <div className="text-xs font-mono text-bark-faint">Deal {dealId?.substring(0, 8)}</div>
        </div>

        <div className="paper-card p-8 md:p-10 space-y-10">
          <div className="grid grid-cols-2 gap-10 pb-8 border-b border-line">
            <div className="space-y-2.5">
              <div className="text-[11px] font-semibold text-clay-400 uppercase tracking-widest">Agreed price</div>
              <div className="text-4xl font-serif font-medium text-bark flex items-end gap-2">
                {finalPrice || 0} <span className="text-xs text-bark-faint font-sans mb-1.5">XLM</span>
              </div>
            </div>
            <div className="space-y-2.5 text-right">
              <div className="text-[11px] font-semibold text-bark-faint uppercase tracking-widest flex items-center justify-end gap-1.5">
                Deadline <Calendar size={12} />
              </div>
              <div className="text-lg font-medium text-bark">
                {requestData.deadline || "Not specified"}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-xs font-semibold text-bark-faint uppercase tracking-[0.2em] flex items-center gap-2.5">
              <ListChecks size={16} className="text-clay-400" />
              <span>Milestones</span>
            </h3>

            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-xl bg-surface border border-line hover:border-clay-400/25 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-surface-raised border border-line flex items-center justify-center text-xs font-semibold text-clay-400">{i+1}</div>
                    <div className="text-sm font-medium text-bark">{m.task}</div>
                  </div>
                  <div className="text-base font-mono font-medium text-bark flex items-center gap-2">
                    <Coins size={14} className="text-clay-400/60" /> {m.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-clay-500/5 border border-clay-500/15 flex items-start gap-5">
            <div className="w-10 h-10 rounded-xl bg-clay-500/10 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-clay-400" />
            </div>
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-clay-400 uppercase tracking-widest">Escrow security</div>
              <div className="text-sm leading-relaxed text-bark-muted">
                Terms are locked in a Soroban smart contract and only released once milestones are verified.
              </div>
            </div>
          </div>

          <SmartDealSummary
            summary={smartSummary}
            loading={summaryLoading}
            error={summaryError}
            isBuyer={isBuyer}
            confirmed={summaryConfirmed}
            onConfirm={() => setSummaryConfirmed(true)}
            x402Status={x402Status}
            paymentProof={paymentProof}
            onPaymentProofChange={setPaymentProof}
            onVerifyPayment={handleVerifyPayment}
            verifyingPayment={verifyingPayment}
          />

          <div className="space-y-4">
            {funded ? (
              <button
                onClick={() => navigate('/active-deal', { state: { dealId } })}
                className="w-full btn-clay flex items-center justify-center gap-2"
              >
                View escrow <ArrowRight size={18} />
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleAuthorize}
                  disabled={loading || !userRole || (isSeller && approvals.seller) || (isBuyer && existsOnChain) || (isBuyer && (!summaryConfirmed || x402Status?.status !== 'authorized'))}
                  className="w-full btn-clay flex items-center justify-center gap-2"
                >
                  {isBuyer ? (existsOnChain ? 'Escrow funded' : (x402Status?.status === 'authorized' ? 'Fund escrow' : 'Continue')) : (approvals.seller ? 'Accepted' : 'Accept offer')}
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !dealId || !userRole}
                  className="w-full py-3.5 rounded-xl bg-surface border border-line text-bark-muted font-medium text-sm hover:bg-red-400/10 hover:text-red-300 hover:border-red-400/20 transition-all"
                >
                  Decline
                </button>
              </div>
            )}

            <AnimatePresence>
              {txStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-medium text-bark-muted text-center bg-surface py-3.5 rounded-xl border border-line"
                >
                  {txStatus}
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
