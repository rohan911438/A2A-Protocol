import React from 'react';
import { FileText, ShieldAlert, Clock3, Wallet, Landmark, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

const RiskBadge = ({ label, score }) => {
  const lower = String(label || 'unknown').toLowerCase();
  const tone =
    lower === 'high'
      ? 'bg-red-500/10 text-red-300 border-red-400/30'
      : lower === 'medium'
        ? 'bg-amber-500/10 text-amber-300 border-amber-400/30'
        : 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30';

  return (
    <div className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.22em] ${tone}`}>
      {lower} risk ({score})
    </div>
  );
};

const DataRow = ({ label, value }) => (
  <div className="grid grid-cols-[170px_1fr] gap-4 py-3 border-b border-white/5 text-sm">
    <div className="text-slate/70 uppercase tracking-[0.14em] text-[10px] font-black">{label}</div>
    <div className="text-white font-semibold break-all">{value}</div>
  </div>
);

const SmartDealSummary = ({ summary, loading, error, isBuyer, confirmed, onConfirm, x402Status, paymentProof, onPaymentProofChange, onVerifyPayment, verifyingPayment }) => {
  if (loading) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-8">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-indigo-300">
          <FileText size={14} /> Smart Deal Summary
        </div>
        <p className="mt-4 text-sm text-slate/70">Compiling structured agreement details...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-[2rem] border border-red-400/20 bg-red-500/5 p-8">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-red-300">
          <ShieldAlert size={14} /> Smart Deal Summary
        </div>
        <p className="mt-4 text-sm text-red-200/90">{error || 'Summary is not available yet.'}</p>
      </div>
    );
  }

  const agreement = summary.agreement || {};
  const participants = summary.participants || {};
  const buyer = participants.buyer_agent || {};
  const seller = participants.seller_agent || {};
  const risk = summary.risk_assessment || {};
  const payment = agreement.payment_structure || {};
  const milestones = payment.milestones || [];
  const x402State = String(x402Status?.status || 'authorized');
  const x402Tone =
    x402State === 'authorized'
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30'
      : x402State === 'verifying_payment'
        ? 'bg-amber-500/10 text-amber-300 border-amber-400/30'
        : 'bg-red-500/10 text-red-300 border-red-400/30';
  const x402Label =
    x402State === 'authorized'
      ? 'Authorization Simulated - Proceeding'
      : x402State === 'verifying_payment'
        ? 'Verifying Simulation'
        : 'Authorization Pending';

  return (
    <div className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-8 space-y-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-indigo-300">
            <FileText size={14} /> Smart Deal Summary
          </div>
          <h3 className="mt-3 text-2xl font-display font-black text-white uppercase tracking-tight">Finalized Agreement Snapshot</h3>
          <p className="mt-2 text-xs text-slate/70">Contract-style summary generated from current negotiation outputs.</p>
        </div>
        <RiskBadge label={risk.label} score={risk.score ?? 'N/A'} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-ink-900/60 px-6 py-3 text-[10px] text-slate/70 uppercase tracking-[0.22em]">
        Deal ID: <span className="text-white font-mono tracking-normal normal-case">{summary.deal_id || 'N/A'}</span>
      </div>

      <div className={`rounded-2xl border px-5 py-4 flex items-center justify-between gap-4 ${x402Tone}`}>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] flex items-center gap-2">
            <ShieldCheck size={12} /> Protocol Authorization
          </div>
          <div className="mt-1 text-sm font-semibold text-white/90">{x402Label}</div>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/70">
          {x402Status?.purpose || 'simulation'}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6">
        <DataRow label="Final Agreed Price" value={`${agreement.final_agreed_price ?? 0} ${agreement.asset || 'XLM'}`} />
        <DataRow label="Estimated Delivery" value={agreement.estimated_delivery || 'Not specified'} />
        <DataRow label="Milestones" value={`${agreement.milestones_count ?? 0} stage(s)`} />
        <DataRow label="Payment Structure" value={payment.note || 'Not specified'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
            <Wallet size={12} /> {buyer.identity || 'Buyer Agent'}
          </div>
          <div className="font-mono text-xs text-white break-all">{buyer.wallet_address || 'N/A'}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
            <Landmark size={12} /> {seller.identity || 'Seller Agent'}
          </div>
          <div className="font-mono text-xs text-white break-all">{seller.wallet_address || 'N/A'}</div>
        </div>
      </div>

      {milestones.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stellar-cyan">
            <Clock3 size={12} /> Milestone Payment Map
          </div>
          <div className="space-y-2">
            {milestones.map((item) => (
              <div key={`milestone-${item.index}`} className="flex items-center justify-between text-sm border-b border-white/5 py-2">
                <div className="text-white/90 font-semibold">Stage {item.index}</div>
                <div className="text-slate/80 font-mono">{item.amount} XLM ({item.percentage}%)</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isBuyer && x402State !== 'authorized' && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stellar-cyan">
            <ShieldCheck size={12} /> Authorization Simulation
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate/60">Amount</div>
              <div className="text-white font-semibold">{x402Status?.amount ?? 0} XLM</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate/60">Recipient</div>
              <div className="text-white font-mono text-xs break-all">{x402Status?.recipient_wallet || 'N/A'}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate/60">Simulation Note or Optional Tx Hash</div>
            <input
              value={paymentProof}
              onChange={(event) => onPaymentProofChange?.(event.target.value)}
              placeholder="Enter a testnet tx hash or leave blank for simulation"
              className="w-full rounded-2xl bg-ink-900/70 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate/40 outline-none focus:border-indigo-400/50"
            />
          </div>
          <button
            onClick={onVerifyPayment}
            disabled={verifyingPayment}
            className="w-full py-4 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-100 font-black uppercase tracking-[0.22em] text-xs flex items-center justify-center gap-2 hover:bg-indigo-500/20 transition-all disabled:opacity-60"
          >
            {verifyingPayment ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {paymentProof ? 'Verify Testnet Proof' : 'Use Simulation Mode'}
          </button>
        </div>
      )}

      {isBuyer && (
        <button
          onClick={onConfirm}
          className={`w-full py-4 rounded-2xl border text-xs font-black uppercase tracking-[0.24em] transition-all flex items-center justify-center gap-2 ${
            confirmed
              ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
              : 'bg-indigo-500/10 border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/20'
          }`}
        >
          <CheckCircle2 size={16} />
          {confirmed ? 'Summary Confirmed - Escrow Simulation Enabled' : 'Confirm Summary To Continue'}
        </button>
      )}
    </div>
  );
};

export default SmartDealSummary;
