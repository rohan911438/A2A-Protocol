import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, TrendingUp, CheckCircle2, ExternalLink, ArrowRight, Circle } from 'lucide-react';
import { listDeals, approveDeal, rejectDeal, recordOnchainAccept, fundDeal } from '../services/DealService';
import { useWallet } from '../context/WalletContext';
import { getCreateDealTxn, getAcceptTxnForDeal, getContractInfo, getDepositTxns, submitSignedTxns } from '../services/ContractService';
import { walletService } from '../services/AlgorandWalletService';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [deals, setDeals] = useState([]);
  const [contractInfo, setContractInfo] = useState(null);
  const [actionStatus, setActionStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();
  const { account, connected } = useWallet();

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
    const title = request?.title || request?.description?.split('—')[0]?.trim() || request?.description || 'Deal';
    const finalPrice = deal.data?.result?.final_price || deal.data?.final_price || request?.budget || 0;
    const statusKey = (deal.status || '').toLowerCase();
    
    // Mapping internal status to display status and route
    let displayStatus = 'Negotiating';
    let route = '/negotiation-room';
    let actionLabel = 'Resume';

    if (statusKey === 'rejected') {
      displayStatus = 'Rejected';
      route = '/dashboard';
      actionLabel = 'Dismiss';
    } else if (statusKey === 'negotiated' || statusKey === 'success') {
      displayStatus = 'Negotiated';
      route = '/summary';
      actionLabel = 'Review Offer';
    } else if (statusKey === 'active') {
      displayStatus = 'Active';
      route = '/active-deal';
      actionLabel = 'Track Escrow';
    } else if (statusKey === 'completed') {
      displayStatus = 'Completed';
      route = '/completion';
      actionLabel = 'View Settlement';
    }

    return {
      id: deal.id,
      title,
      price: Math.round(finalPrice),
      status: displayStatus,
      route,
      actionLabel,
      data: deal.data,
    };
  }), [deals]);

  const activeDeals = normalized.filter((d) => d.status !== 'Completed' && d.status !== 'Rejected');
  const completedDeals = normalized.filter((d) => d.status === 'Completed');
  const negotiatedDeals = normalized.filter((d) => d.status === 'Negotiated');
  const onchainActiveDeals = normalized.filter((d) => d.status === 'Active');
  const sellerOnchainDeals = normalized.filter((d) => {
    const request = d.data?.request || d.data || {};
    const sellerWallet = d.data?.seller_wallet || '';
    const isSeller = account && sellerWallet && account.toLowerCase() === sellerWallet.toLowerCase();
    const onchain = d.data?.onchain_accepts || {};
    return isSeller && onchain.seller && d.status !== 'Active' && d.status !== 'Completed';
  });
  const dealsNeedingYourApproval = negotiatedDeals.filter((deal) => {
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
  const currentDeals = activeTab === 'active' ? activeDeals : completedDeals;

  const handleApprove = async (deal) => {
    const request = deal.data?.request || deal.data || {};
    const buyerWallet = request?.buyer_wallet || '';
    const sellerWallet = deal.data?.seller_wallet || '';
    const role = account && account.toLowerCase() === buyerWallet.toLowerCase() ? 'buyer' : account && account.toLowerCase() === sellerWallet.toLowerCase() ? 'seller' : null;
    if (!role) return;
    if (!connected || !account) {
      setActionStatus('Connect wallet to sign on-chain.');
      return;
    }
    setActionLoading(true);
    setActionStatus('Preparing on-chain acceptance...');
    try {
      await approveDeal(deal.id, role);
      if (role === 'seller') {
        const onchain = deal.data?.onchain_accepts || {};
        if (!onchain.buyer) {
          setActionStatus('Waiting for buyer to create escrow on-chain.');
          return;
        }
        const { txn } = await getAcceptTxnForDeal(account, deal.id);
        const signed = await walletService.signTransactions(txn, 'TestNet');
        const { txids } = await submitSignedTxns(signed);
        await recordOnchainAccept(deal.id, 'seller', txids[0]);
        setActionStatus(`Seller accepted on-chain. TxID: ${txids[0]}`);
      } else {
        const amount = Math.max(Math.round(deal.price || 0), 0);
        if (!amount) {
          setActionStatus('Final price is missing. Cannot create escrow.');
          return;
        }
        const milestones =
          deal.data?.result?.milestones?.length
            ? deal.data.result.milestones
            : [Math.round(amount * 0.4), Math.max(amount - Math.round(amount * 0.4), 0)].filter((v) => v > 0);
        const { txns } = await getCreateDealTxn(account, deal.id, amount, milestones);
        const signed = await walletService.signTransactions(txns, 'TestNet');
        const { txids } = await submitSignedTxns(signed);
        await recordOnchainAccept(deal.id, 'buyer', txids[0]);
        const { txns: depositTxns } = await getDepositTxns(account, deal.id, amount);
        const signedDeposit = await walletService.signTransactions(depositTxns, 'TestNet');
        const { txids: depositTxids } = await submitSignedTxns(signedDeposit);
        await fundDeal(deal.id, depositTxids[0]);
        setActionStatus('Buyer created escrow and funded it on-chain.');
      }
      loadDeals();
    } catch (err) {
      setActionStatus(err.message || 'Acceptance failed');
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
    <div className="pt-32 pb-20 px-6 min-h-screen bg-ink-900">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-white font-display italic tracking-tight">Your Deals</h1>
            <p className="text-slate text-sm">Monitor and manage your autonomous negotiations.</p>
          </div>
          <Link to="/create-deal" className="px-8 py-3.5 bg-gradient-to-r from-aqua to-blush text-ink-900 rounded-2xl font-bold shadow-soft transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(94,240,255,0.4)]">
            Start New Deal
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: 'Active Deals', value: activeDeals.length, icon: <TrendingUp className="text-aqua" /> },
            { label: 'Total Completed', value: completedDeals.length, icon: <CheckCircle2 className="text-lime" /> }
          ].map((stat) => (
            <div key={stat.label} className="p-8 rounded-[2rem] bg-ink-800/50 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors backdrop-blur-sm">
              <div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-[10px] font-mono text-slate uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          {sellerOnchainDeals.length > 0 && (
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-slate">Seller Accepted (On-Chain)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sellerOnchainDeals.map((deal) => (
                  <div key={deal.id} className="p-6 rounded-2xl bg-ink-800/40 border border-white/10 flex flex-col gap-4">
                    <div>
                      <div className="text-lg font-bold text-white">{deal.title}</div>
                      <div className="text-sm text-slate">{deal.price} ALGO</div>
                      <div className="text-xs text-slate/70">Awaiting buyer funding</div>
                    </div>
                    <button
                      onClick={() => navigate('/active-deal', { state: { dealId: deal.id } })}
                      className="px-4 py-2 rounded-xl bg-aqua/10 border border-aqua/30 text-aqua text-xs font-bold"
                    >
                      View Active Deal
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {onchainActiveDeals.length > 0 && (
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-slate">Active Deals (On-Chain)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {onchainActiveDeals.map((deal) => (
                  <div key={deal.id} className="p-6 rounded-2xl bg-ink-800/40 border border-white/10 flex flex-col gap-4">
                    <div>
                      <div className="text-lg font-bold text-white">{deal.title}</div>
                      <div className="text-sm text-slate">{deal.price} ALGO</div>
                    </div>
                    <button
                      onClick={() => navigate('/active-deal', { state: { dealId: deal.id } })}
                      className="px-4 py-2 rounded-xl bg-aqua/10 border border-aqua/30 text-aqua text-xs font-bold"
                    >
                      View Active Deal
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {actionStatus && (
            <div className="text-xs text-slate">{actionStatus}</div>
          )}
          {dealsNeedingYourApproval.length > 0 && (
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-slate">Deals Needing Approval</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dealsNeedingYourApproval.map((deal) => {
                  const request = deal.data?.request || deal.data || {};
                  const buyerWallet = request?.buyer_wallet || '';
                  const sellerWallet = deal.data?.seller_wallet || '';
                  const role = account && account.toLowerCase() === buyerWallet.toLowerCase()
                    ? 'buyer'
                    : account && account.toLowerCase() === sellerWallet.toLowerCase()
                      ? 'seller'
                      : null;
                  const canAct = Boolean(role);
                  return (
                  <div key={deal.id} className="p-6 rounded-2xl bg-ink-800/40 border border-white/10 flex flex-col gap-4">
                    <div>
                      <div className="text-lg font-bold text-white">{deal.title}</div>
                      <div className="text-sm text-slate">{deal.price} ALGO</div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(deal)}
                        disabled={actionLoading || !canAct}
                        className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10"
                      >
                        Accept Offer
                      </button>
                      <button
                        onClick={() => handleReject(deal)}
                        disabled={actionLoading || !canAct}
                        className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10"
                      >
                        Reject Offer
                      </button>
                      <button
                        onClick={() => navigate('/summary', { state: { dealId: deal.id } })}
                        className="px-4 py-2 rounded-xl bg-aqua/10 border border-aqua/30 text-aqua text-xs font-bold"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 p-1.5 bg-ink-800/50 rounded-2xl border border-white/5 w-fit">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-aqua text-ink-900 shadow-lg' : 'text-slate hover:text-white'}`}
            >
              Active Deals
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'completed' ? 'bg-blush text-ink-900 shadow-lg' : 'text-slate hover:text-white'}`}
            >
              Completed Deals
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="wait">
              {currentDeals.map((deal, i) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-ink-800/40 border border-white/10 rounded-[2rem] p-8 hover:bg-ink-800/60 transition-all hover:border-white/20 flex flex-col justify-between min-h-[220px]"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border ${
                        deal.status === 'Completed' ? 'bg-lime/10 border-lime/20 text-lime' : 'bg-aqua/10 border-aqua/20 text-aqua'
                      }`}>
                        {deal.status}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-aqua transition-colors">{deal.title}</h3>
                    <div className="text-2xl font-display font-bold text-white/90">{deal.price} ALGO</div>
                  </div>

                  <div className="pt-6 flex justify-between items-center bg-ink-800/50">
                    <button 
                      onClick={() => navigate(deal.route, { state: { dealId: deal.id } })}
                      className="px-6 py-2.5 rounded-xl bg-white text-ink-900 text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 group/btn"
                    >
                      {deal.actionLabel} <ArrowRight size={12} className="group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {currentDeals.length === 0 && (
            <div className="text-center py-20 bg-ink-800/20 rounded-[3rem] border border-dashed border-white/10">
              <LayoutDashboard size={48} className="mx-auto text-slate/20 mb-4" />
              <p className="text-slate font-display">No deals found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
