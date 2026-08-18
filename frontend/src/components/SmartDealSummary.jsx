import React from 'react';
import { FileText, ShieldAlert, Clock3, Wallet, Landmark, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

const RiskBadge = ({ label, score }) => {
  const lower = String(label || 'unknown').toLowerCase();
  const tone =
    lower === 'high'
      ? 'bg-red-500/10 text-red-300 border-red-400/25'
      : lower === 'medium'
        ? 'bg-amber-500/10 text-amber-300 border-amber-400/25'
        : 'bg-moss-400/10 text-moss-400 border-moss-400/25';

  return (
    <div className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold ${tone}`}>
      {lower} risk ({score})
    </div>
  );
};

const DataRow = ({ label, value }) => (
  <div className="grid grid-cols-[160px_1fr] gap-4 py-3 border-b border-line last:border-0 text-sm">
    <div className="text-bark-faint text-[11px] font-semibold uppercase tracking-wider">{label}</div>
    <div className="text-bark font-medium break-all">{value}</div>
  </div>
);

const SmartDealSummary = ({ summary, loading, error, isBuyer, confirmed, onConfirm, x402Status, paymentProof, onPaymentProofChange, onVerifyPayment, verifyingPayment }) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-7">
        <div className="flex items-center gap-2.5 text-xs font-semibold text-clay-400 uppercase tracking-wider">
          <FileText size={14} /> Smart deal summary
        </div>
        <p className="mt-3 text-sm text-bark-muted">Compiling agreement details...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-7">
        <div className="flex items-center gap-2.5 text-xs font-semibold text-red-300 uppercase tracking-wider">
          <ShieldAlert size={14} /> Smart deal summary
        </div>
        <p className="mt-3 text-sm text-red-200/90">{error || 'Summary is not available yet.'}</p>
      </div>
    );
  }

  const agreement = summary.agreement || {};
  const participants = summary.participants || {};
  const buyer = participants.buyer_agent || {};
  const seller = participants.seller_agent || {};
  const DEMO_SELLER_DISPLAY_WALLET = 'GDSKIX6A3A7Y7WBXXSOBE4Y6O5YVJYQLL3K3QK5L7P2WNJ2WNPYH42ZJ';
  const buyerWalletRaw = String(buyer.wallet_address || '');
  const sellerWalletRaw = String(seller.wallet_address || '');
  const sellerWalletDisplay = buyerWalletRaw && sellerWalletRaw && buyerWalletRaw.toLowerCase() === sellerWalletRaw.toLowerCase()
    ? DEMO_SELLER_DISPLAY_WALLET
    : (sellerWalletRaw || 'N/A');
  const risk = summary.risk_assessment || {};
  const payment = agreement.payment_structure || {};
  const milestones = payment.milestones || [];
  const x402State = String(x402Status?.status || 'authorized');
  const x402Tone =
    x402State === 'authorized'
      ? 'bg-moss-400/10 text-moss-400 border-moss-400/25'
      : x402State === 'verifying_payment'
        ? 'bg-amber-500/10 text-amber-300 border-amber-400/25'
        : 'bg-clay-500/10 text-clay-400 border-clay-500/25';
  const x402Label =
    x402State === 'authorized'
      ? 'Authorized'
      : x402State === 'verifying_payment'
        ? 'Verifying...'
        : 'Authorization required';

  return (
    <div className="rounded-2xl border border-line bg-surface p-7 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-clay-400 uppercase tracking-wider">
            <FileText size={14} /> Smart deal summary
          </div>
          <h3 className="mt-2.5 text-xl font-serif font-medium text-bark">Agreement details</h3>
          <p className="mt-1.5 text-xs text-bark-faint">Generated from the current negotiation outcome.</p>
        </div>
        <RiskBadge label={risk.label} score={risk.score ?? 'N/A'} />
      </div>

      <div className="rounded-xl border border-line bg-surface-raised px-5 py-3 text-[11px] text-bark-faint uppercase tracking-wider">
        Deal ID: <span className="text-bark font-mono normal-case">{summary.deal_id || 'N/A'}</span>
      </div>

      <div className={`rounded-xl border px-5 py-4 flex items-center justify-between gap-4 ${x402Tone}`}>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={12} /> Payment authorization
          </div>
          <div className="mt-1 text-sm font-medium">{x402Label}</div>
        </div>
        <div className="text-[11px] font-mono uppercase tracking-wider opacity-80">
          {x402Status?.purpose || 'simulation'}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface-raised px-6">
        <DataRow label="Final agreed price" value={`${agreement.final_agreed_price ?? 0} ${agreement.asset || 'XLM'}`} />
        <DataRow label="Estimated delivery" value={agreement.estimated_delivery || 'Not specified'} />
        <DataRow label="Milestones" value={`${agreement.milestones_count ?? 0} stage(s)`} />
        <DataRow label="Payment structure" value={payment.note || 'Not specified'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-line bg-surface-raised p-5 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-clay-400 uppercase tracking-wider">
            <Wallet size={12} /> {buyer.identity || 'Buyer agent'}
          </div>
          <div className="font-mono text-xs text-bark break-all">{buyer.wallet_address || 'N/A'}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface-raised p-5 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-moss-400 uppercase tracking-wider">
            <Landmark size={12} /> {seller.identity || 'Seller agent'}
          </div>
          <div className="font-mono text-xs text-bark break-all">{sellerWalletDisplay}</div>
        </div>
      </div>

      {milestones.length > 0 && (
        <div className="rounded-xl border border-line bg-surface-raised p-5 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-clay-400 uppercase tracking-wider">
            <Clock3 size={12} /> Milestone breakdown
          </div>
          <div className="space-y-1">
            {milestones.map((item) => (
              <div key={`milestone-${item.index}`} className="flex items-center justify-between text-sm border-b border-line last:border-0 py-2">
                <div className="text-bark font-medium">Stage {item.index}</div>
                <div className="text-bark-muted font-mono">{item.amount} XLM ({item.percentage}%)</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isBuyer && x402State !== 'authorized' && (
        <div className="rounded-xl border border-line bg-surface-raised p-5 space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-clay-400 uppercase tracking-wider">
            <ShieldCheck size={12} /> Confirm payment
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-bark-faint uppercase tracking-wider">Amount</div>
              <div className="text-bark font-medium">{x402Status?.amount ?? 0} XLM</div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-bark-faint uppercase tracking-wider">Recipient</div>
              <div className="text-bark font-mono text-xs break-all">{x402Status?.recipient_wallet || 'N/A'}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-bark-faint uppercase tracking-wider">Testnet tx hash (optional)</div>
            <input
              value={paymentProof}
              onChange={(event) => onPaymentProofChange?.(event.target.value)}
              placeholder="Enter a testnet tx hash or leave blank for simulation"
              className="w-full rounded-xl bg-surface border border-line px-4 py-3 text-sm text-bark placeholder:text-bark-faint outline-none focus:border-clay-400/50"
            />
          </div>
          <button
            onClick={onVerifyPayment}
            disabled={verifyingPayment}
            className="w-full py-3.5 rounded-xl border border-clay-500/30 bg-clay-500/10 text-clay-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-clay-500/20 transition-all disabled:opacity-60"
          >
            {verifyingPayment ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {paymentProof ? 'Verify transaction' : 'Confirm'}
          </button>
        </div>
      )}

      {isBuyer && (
        <button
          onClick={onConfirm}
          className={`w-full py-3.5 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            confirmed
              ? 'bg-moss-400/10 border-moss-400/25 text-moss-400'
              : 'bg-clay-500/10 border-clay-500/25 text-clay-400 hover:bg-clay-500/20'
          }`}
        >
          <CheckCircle2 size={16} />
          {confirmed ? 'Summary confirmed' : 'Confirm summary to continue'}
        </button>
      )}
    </div>
  );
};

export default SmartDealSummary;
