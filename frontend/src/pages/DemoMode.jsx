import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, CheckCircle2, Loader2, AlertTriangle, ArrowRight, Terminal, Coins, ShieldCheck } from 'lucide-react';
import {
  createDeal,
  acceptDealWithWallet,
  startNegotiation,
  approveDeal,
  recordOnchainAccept,
  fundDeal,
  recordRelease,
  completeDeal,
  getDeal,
} from '../services/DealService';
import { getCreateDealTxn } from '../services/ContractService';

const DEMO_BUYER_WALLET = 'GDODHOICP53SCQYY6XRFKGNSOKMTSNDRDI2CHKFQDLMFHGYAQ2D7CAZI';
const DEMO_SELLER_WALLET = 'GC5OZM7AY73DKZMPWU5BMW3EA6BXCYJIIF6UUQQ44XT4DOJQOXQZU2YF';

const STEP_LABELS = [
  'Creating sample task',
  'Instantiating buyer and seller agents',
  'Running negotiation',
  'Finalizing deal terms',
  'Escrow created (testnet simulation)',
  'Simulating task completion',
  'Verifier agent validating output',
  'Releasing payment and closing lifecycle',
];

const initialSteps = STEP_LABELS.map((label) => ({
  label,
  status: 'pending',
  message: 'Waiting...',
}));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const demoHash = () => {
  const chars = 'abcdef0123456789';
  let out = '';
  for (let i = 0; i < 64; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

const DemoMode = () => {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(initialSteps);
  const [dealId, setDealId] = useState(null);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  const updateStep = (index, status, message) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, status, message } : s)));
  };

  const progress = useMemo(() => {
    const done = steps.filter((s) => s.status === 'done').length;
    return Math.round((done / steps.length) * 100);
  }, [steps]);

  const runDemo = async () => {
    if (running) return;
    setRunning(true);
    setError('');
    setSummary(null);
    setSteps(initialSteps);

    let createdDealId = null;
    let negotiated = null;

    try {
      updateStep(0, 'running', 'Submitting sample task payload...');
      const createResp = await createDeal({
        title: 'Demo AI Integration Sprint',
        budget: 120,
        min_price: 90,
        deadline: '2026-12-31',
        description: 'Build and validate AI assistant integration with milestone-based delivery.',
        buyer_wallet: DEMO_BUYER_WALLET,
      });
      createdDealId = createResp.deal_id;
      setDealId(createdDealId);
      await sleep(1200);
      updateStep(0, 'done', `Deal created: ${createdDealId.slice(0, 8)}...`);

      updateStep(1, 'running', 'Seller agent accepted invitation and registered wallet...');
      await acceptDealWithWallet(createdDealId, DEMO_SELLER_WALLET);
      await sleep(900);
      updateStep(1, 'done', 'Buyer and seller agent profiles initialized.');

      updateStep(2, 'running', 'Negotiating price and terms...');
      try {
        negotiated = await startNegotiation(createdDealId);
      } catch {
        negotiated = {
          status: 'negotiated',
          final_price: 108,
          rounds: 3,
          conversation: [
            { buyer: 'Starting from a performance-focused budget.', seller: 'We can commit with quality safeguards.', buyer_price: 96, seller_price: 118 },
            { buyer: 'Can we optimize scope to fit budget?', seller: 'Yes, with a milestone split.', buyer_price: 102, seller_price: 112 },
            { buyer: 'Agreed if verification is included.', seller: 'Confirmed, closing at 108.', buyer_price: 108, seller_price: 108 },
          ],
        };
      }
      await sleep(1800);
      updateStep(2, 'done', `Negotiation complete in ${negotiated.rounds || 3} rounds.`);

      updateStep(3, 'running', 'Capturing final approvals...');
      await approveDeal(createdDealId, 'buyer');
      await approveDeal(createdDealId, 'seller');
      await sleep(900);
      updateStep(3, 'done', 'Deal terms finalized and approved by both agents.');

      updateStep(4, 'running', 'Creating escrow transaction payload for Stellar testnet...');
      const finalPrice = Number(negotiated?.final_price || 108);
      const first = Math.round(finalPrice * 0.4);
      const second = Math.max(finalPrice - first, 0);
      const milestones = [first, second].filter((v) => v > 0);
      await getCreateDealTxn(DEMO_BUYER_WALLET, createdDealId, finalPrice, milestones);
      const fundTxHash = demoHash();
      await recordOnchainAccept(createdDealId, 'buyer', fundTxHash);
      await recordOnchainAccept(createdDealId, 'seller', demoHash());
      await fundDeal(createdDealId, fundTxHash);
      await sleep(1200);
      updateStep(4, 'done', `Escrow created and funded. Tx: ${fundTxHash.slice(0, 10)}...`);

      updateStep(5, 'running', 'Simulating task completion signals...');
      await sleep(2200);
      updateStep(5, 'done', 'Task delivery marked completed by automation flow.');

      updateStep(6, 'running', 'Verifier agent checking milestone outputs...');
      await sleep(1800);
      updateStep(6, 'done', 'Verifier approved all deliverables.');

      updateStep(7, 'running', 'Releasing milestone payments and finalizing deal...');
      for (let i = 0; i < milestones.length; i++) {
        await recordRelease(createdDealId, i, demoHash());
        await sleep(700);
      }
      await completeDeal(createdDealId);
      await sleep(800);
      updateStep(7, 'done', 'Payment released and lifecycle closed.');

      const finalRecord = await getDeal(createdDealId).catch(() => null);
      setSummary({
        dealId: createdDealId,
        finalPrice,
        status: finalRecord?.status || 'Completed',
      });
    } catch (err) {
      const msg = err?.message || 'Demo failed unexpectedly.';
      setError(msg);
      const idx = steps.findIndex((s) => s.status === 'running');
      if (idx >= 0) updateStep(idx, 'error', msg);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="pt-28 pb-24 px-6 min-h-screen flex flex-col items-center relative overflow-hidden">
      <div className="max-w-5xl w-full space-y-10 z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em]">
              <Terminal size={13} /> Demo Mode
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-black text-white uppercase tracking-tight leading-none">
              Instant Product Walkthrough
            </h1>
            <p className="text-slate/80 max-w-2xl text-sm">
              One-click simulation of the full A2A lifecycle: negotiation, escrow, verification, and payment release.
            </p>
          </div>
          <button
            onClick={runDemo}
            disabled={running}
            className="px-8 py-4 rounded-2xl bg-white text-ink-900 font-black uppercase tracking-[0.2em] text-xs shadow-glow hover:scale-[1.02] transition-all disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} {running ? 'Running Demo...' : 'Run Demo'}
            </span>
          </button>
        </div>

        <div className="glass-morphism border border-white/10 rounded-[2rem] p-6 md:p-8 space-y-6">
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] font-black text-slate/70 mb-2">
              <span>Demo Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-500" animate={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, idx) => (
              <div key={step.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300 mb-1">Step {idx + 1}</div>
                    <div className="text-sm font-bold text-white">{step.label}</div>
                    <div className="text-xs text-slate/80 mt-2">{step.message}</div>
                  </div>
                  {step.status === 'done' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
                  {step.status === 'running' && <Loader2 size={18} className="text-cyan-300 animate-spin shrink-0" />}
                  {step.status === 'error' && <AlertTriangle size={18} className="text-red-400 shrink-0" />}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-xs text-red-300 uppercase tracking-[0.15em] font-black">
              {error}
            </div>
          )}

          {summary && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.25em] font-black text-emerald-300 inline-flex items-center gap-2"><ShieldCheck size={14} /> Demo Completed</div>
                <div className="text-sm text-white font-bold">Deal {summary.dealId.slice(0, 8)}... finalized at {summary.finalPrice} XLM</div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-3 rounded-xl bg-white text-ink-900 text-xs font-black uppercase tracking-[0.2em]"
                >
                  Open Dashboard
                </button>
                <button
                  onClick={() => navigate('/completion', { state: { dealId: summary.dealId } })}
                  className="px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-black uppercase tracking-[0.2em] inline-flex items-center gap-2"
                >
                  View Completion <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoMode;