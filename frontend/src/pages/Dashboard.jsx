import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, CheckCircle2, ArrowRight, Coins, Activity, ShieldCheck, Search, Inbox } from 'lucide-react';
import { listDeals, approveDeal, rejectDeal, recordOnchainAccept, fundDeal } from '../services/DealService';
import { useWallet } from '../context/WalletContext';
import { getCreateDealTxn, getContractInfo, submitSignedXdr } from '../services/ContractService';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [deals, setDeals] = useState([]);
  const [contractInfo, setContractInfo] = useState(null);
  const [actionStatus, setActionStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { account, connected, signTransaction, fetchBalances } = useWallet();

  const loadDeals = () => {
    listDeals()
      .then((data) => {
        const items = Object.entries(data || {}).map(([id, record]) => ({
          id,
          status: record.status || 'created',
          data: record.data || {},
        }));
        setDeals(items);
      })
      .catch(() => setDeals([]));
  };

  useEffect(() => {
    loadDeals();
  }, []);

  useEffect(() => {
    getContractInfo()
      .then(setContractInfo)
      .catch(() => {});
  }, []);

  const normalized = useMemo(() => deals.map((deal) => {
    const request = deal.data?.request || deal.data || {};
    const title = request?.title || request?.description?.split('—')[0]?.trim() || request?.description || 'Untitled deal';
    const finalPrice = deal.data?.result?.final_price || deal.data?.final_price || request?.budget || 0;
    const statusKey = (deal.status || '').toLowerCase();

    let displayStatus = 'Negotiating';
    let route = '/negotiation-room';
    let actionLabel = 'Resume negotiation';
    let colorClass = 'bg-clay-500/10 border-clay-500/25 text-clay-400';

    if (statusKey === 'rejected') {
      displayStatus = 'Rejected';
      route = '/dashboard';
      actionLabel = 'Dismiss';
      colorClass = 'bg-red-400/10 border-red-400/25 text-red-300';
    } else if (statusKey === 'negotiated' || statusKey === 'success') {
      displayStatus = 'Agreed';
      route = '/summary';
      actionLabel = 'Review offer';
      colorClass = 'bg-clay-500/10 border-clay-500/25 text-clay-400';
    } else if (statusKey === 'active') {
      displayStatus = 'Active escrow';
      route = '/active-deal';
      actionLabel = 'View escrow';
      colorClass = 'bg-moss-400/10 border-moss-400/25 text-moss-400';
    } else if (statusKey === 'completed') {
      displayStatus = 'Completed';
      route = '/completion';
      actionLabel = 'View summary';
      colorClass = 'bg-surface border-line text-bark-muted';
    }

    return {
      id: deal.id,
      title,
      price: Math.round(finalPrice),
      status: displayStatus,
      route,
      actionLabel,
      colorClass,
      data: deal.data,
    };
  }), [deals]);

  const activeDeals = normalized.filter((d) => d.status !== 'Completed' && d.status !== 'Rejected');
  const completedDeals = normalized.filter((d) => d.status === 'Completed');
  const dealsNeedingYourApproval = normalized.filter((deal) => {
    if (deal.status !== 'Agreed') return false;
    const request = deal.data?.request || deal.data || {};
    const buyerWallet = request?.buyer_wallet || '';
    const sellerWallet = deal.data?.seller_wallet || '';
    const approvals = deal.data?.approvals || { buyer: false, seller: false };
    const isBuyer = account && buyerWallet && account.toLowerCase() === buyerWallet.toLowerCase();
    const isSeller = account && sellerWallet && account.toLowerCase() === sellerWallet.toLowerCase();
    if (isBuyer) return !approvals.buyer;
    if (isSeller) return !approvals.seller;
    return false;
  });

  const currentDeals = useMemo(() => {
    const base = activeTab === 'active' ? activeDeals : completedDeals;
    if (!query.trim()) return base;
    const q = query.trim().toLowerCase();
    return base.filter((d) => d.title.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
  }, [activeTab, activeDeals, completedDeals, query]);

  const handleApprove = async (deal) => {
    const request = deal.data?.request || deal.data || {};
    const buyerWallet = request?.buyer_wallet || '';
    const sellerWallet = deal.data?.seller_wallet || '';
    const role = account && account.toLowerCase() === buyerWallet.toLowerCase() ? 'buyer' : account && account.toLowerCase() === sellerWallet.toLowerCase() ? 'seller' : null;

    if (!role) return;
    if (!connected || !account) {
      setActionStatus('Connect your wallet to sign on Stellar.');
      return;
    }
    if (!/^G[A-Z2-7]{55}$/.test(account)) {
      setActionStatus('Invalid wallet account selected. Reconnect and choose a Stellar account (G...).');
      return;
    }

    setActionLoading(true);
    setActionStatus('Preparing the escrow transaction...');
    try {
      await approveDeal(deal.id, role);

      if (role === 'buyer') {
        // Mirror the 40/60 milestone split ActiveDeal releases against later
        // instead of recording a single lump-sum milestone here - otherwise
        // the on-chain create-txn record never matches the schedule that's
        // actually enforced during release. `amount` is derived as the
        // exact sum of the milestones so it always satisfies the backend's
        // sum-must-equal-total check.
        const storedMilestones = deal.data?.result?.milestones;
        const milestones = storedMilestones?.length
          ? storedMilestones
          : (() => {
              const rounded = Math.max(Math.round(deal.price || 0), 0);
              const first = Math.round(rounded * 0.4);
              const second = Math.max(rounded - first, 0);
              return second > 0 ? [first, second] : [first];
            })();
        const amount = milestones.reduce((sum, v) => sum + Number(v), 0);

        const { xdr } = await getCreateDealTxn(account, deal.id, amount, milestones);
        const signedXdr = await signTransaction(xdr);
        const { tx_hash } = await submitSignedXdr(signedXdr);

        await recordOnchainAccept(deal.id, 'buyer', tx_hash);
        await fundDeal(deal.id, tx_hash);

        setActionStatus(`Escrow funded on Stellar. Tx ${tx_hash.substring(0, 10)}...`);
        await fetchBalances();
      } else {
        setActionStatus('Offer accepted. Waiting for the buyer to fund escrow.');
      }

      loadDeals();
    } catch (err) {
      setActionStatus(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (deal) => {
    const request = deal.data?.request || deal.data || {};
    const buyerWallet = request?.buyer_wallet || '';
    const sellerWallet = deal.data?.seller_wallet || '';
    const role = account && account.toLowerCase() === buyerWallet.toLowerCase() ? 'buyer' : account && account.toLowerCase() === sellerWallet.toLowerCase() ? 'seller' : null;
    if (!role) return;
    await rejectDeal(deal.id, role);
    loadDeals();
  };

  return (
    <div className="pt-32 pb-32 px-6 min-h-screen bg-paper relative overflow-hidden">
      <div className="animate-aurora-a absolute top-[-5%] left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-clay-500/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto w-full space-y-14">

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-clay-400 uppercase tracking-[0.2em]">Dashboard</div>
            <h1 className="text-4xl sm:text-5xl font-serif font-medium text-bark tracking-tight">
              Your deals
            </h1>
            {contractInfo && (
              <p className="text-sm text-bark-faint">{contractInfo.protocol} · {contractInfo.network}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="px-5 py-3 rounded-2xl bg-surface border border-line flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] font-semibold text-bark-faint uppercase tracking-widest">Wallet</div>
                <div className="text-[13px] font-mono font-medium text-bark">{account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Not connected'}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-clay-500/10 border border-clay-500/20 flex items-center justify-center text-clay-400">
                <ShieldCheck size={16} />
              </div>
            </div>
            <Link to="/create-deal" className="btn-clay flex items-center gap-2">
              New deal <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Action status */}
        <AnimatePresence>
          {actionStatus && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-surface border border-line flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-clay-400 animate-pulse" />
                <span className="text-sm text-bark-muted">{actionStatus}</span>
              </div>
              <button onClick={() => setActionStatus('')} className="text-xs font-semibold text-bark-faint hover:text-bark transition-colors">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: 'Active deals', value: activeDeals.length, icon: <Activity size={18} className="text-clay-400" />, desc: 'In progress' },
            { label: 'Completed', value: completedDeals.length, icon: <CheckCircle2 size={18} className="text-moss-400" />, desc: 'Settled on-chain' },
            { label: 'Needs your approval', value: dealsNeedingYourApproval.length, icon: <TrendingUp size={18} className="text-clay-400" />, desc: 'Awaiting sign-off' },
          ].map((stat) => (
            <div key={stat.label} className="paper-card p-7 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-bark-faint uppercase tracking-widest mb-2">{stat.label}</div>
                <div className="text-3xl font-serif font-medium text-bark mb-1">{stat.value}</div>
                <div className="text-xs text-bark-faint">{stat.desc}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-surface-raised border border-line flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Needs approval */}
        <AnimatePresence>
          {dealsNeedingYourApproval.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-bark-faint">
                <ShieldCheck size={14} className="text-clay-400" /> Awaiting your approval
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {dealsNeedingYourApproval.map((deal) => (
                  <div key={deal.id} className="paper-card p-8 flex flex-col gap-6 border-clay-500/25">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-xl font-serif font-medium text-bark">{deal.title}</h3>
                        <div className="text-sm font-mono text-clay-400 flex items-center gap-2">
                          <Coins size={14} /> {deal.price} XLM
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(deal)}
                        disabled={actionLoading}
                        className="flex-1 btn-clay text-center justify-center text-sm py-3"
                      >
                        Approve &amp; fund
                      </button>
                      <button
                        onClick={() => handleReject(deal)}
                        disabled={actionLoading}
                        className="px-5 py-3 rounded-xl bg-surface border border-line text-bark-muted text-sm font-medium hover:border-clay-400/30 hover:text-bark transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deals list */}
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-6 border-b border-line pb-6">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-line">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'active' ? 'bg-clay-500 text-white' : 'text-bark-muted hover:text-bark'}`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'completed' ? 'bg-clay-500 text-white' : 'text-bark-muted hover:text-bark'}`}
              >
                Archive
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface border border-line w-64">
              <Search size={15} className="text-bark-faint" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search deals..."
                className="bg-transparent border-none outline-none text-sm text-bark placeholder:text-bark-faint w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="wait">
              {currentDeals.map((deal, i) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="paper-card p-7 flex flex-col justify-between min-h-[240px]"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${deal.colorClass}`}>
                        {deal.status}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-bark mb-4 line-clamp-2">{deal.title}</h3>
                    <div className="text-2xl font-serif font-medium text-bark flex items-baseline gap-2">
                      {deal.price} <span className="text-xs text-bark-faint font-sans">XLM</span>
                    </div>
                  </div>

                  <div className="pt-7">
                    <button
                      onClick={() => navigate(deal.route, { state: { dealId: deal.id } })}
                      className="w-full py-3 rounded-xl bg-surface-raised border border-line text-bark text-sm font-medium hover:border-clay-400/40 hover:bg-clay-500/[0.06] transition-all duration-300 flex items-center justify-center gap-2 group"
                    >
                      {deal.actionLabel} <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {currentDeals.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 rounded-2xl border border-dashed border-line"
            >
              <div className="inline-flex p-6 rounded-2xl bg-surface mb-6">
                <Inbox size={40} className="text-bark-faint" />
              </div>
              <p className="text-lg font-serif text-bark-muted">
                {query ? 'No deals match your search' : activeTab === 'active' ? 'No active deals yet' : 'No completed deals yet'}
              </p>
              {!query && activeTab === 'active' && (
                <Link to="/create-deal" className="inline-block mt-4 text-sm font-semibold text-clay-400 hover:text-clay-300 transition-colors">
                  Create your first deal →
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
