import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, TrendingUp, CheckCircle2, ArrowRight, Coins } from 'lucide-react';
import { listDeals, approveDeal, rejectDeal, recordOnchainAccept, fundDeal } from '../services/DealService';
import { useWallet } from '../context/WalletContext';
import { getCreateDealTxn, getContractInfo, submitSignedXdr } from '../services/ContractService';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [deals, setDeals] = useState([]);
  const [contractInfo, setContractInfo] = useState(null);
  const [actionStatus, setActionStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
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
    const title = request?.title || request?.description?.split('—')[0]?.trim() || request?.description || 'Deal';
    const finalPrice = deal.data?.result?.final_price || deal.data?.final_price || request?.budget || 0;
    const statusKey = (deal.status || '').toLowerCase();
    
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
  const dealsNeedingYourApproval = normalized.filter((deal) => {
    if (deal.status !== 'Negotiated') return false;
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
      setActionStatus('Connect wallet to sign on Stellar.');
      return;
    }

    setActionLoading(true);
    setActionStatus('Interacting with A2A Protocol logic...');
    try {
      await approveDeal(deal.id, role);
      
      if (role === 'buyer') {
        const amount = Math.max(Math.round(deal.price || 0), 0);
        const milestones = [amount]; 
        
        const { xdr } = await getCreateDealTxn(account, deal.id, amount, milestones);
        const signedXdr = await signTransaction(xdr);
        const { tx_hash } = await submitSignedXdr(signedXdr);
        
        await recordOnchainAccept(deal.id, 'buyer', tx_hash);
        await fundDeal(deal.id, tx_hash);
        
        setActionStatus(`Deal funded on Stellar. Hash: ${tx_hash}`);
        await fetchBalances(); 
      } else {
        setActionStatus('Offer accepted. Waiting for buyer settlement.');
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
    <div className="pt-32 pb-20 px-6 min-h-screen bg-ink-900">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-white font-display italic tracking-tight uppercase">Protocol Terminal</h1>
            <p className="text-slate text-sm">Autonomous Deal Management • Stellar Network</p>
          </div>
          <Link to="/create-deal" className="px-8 py-3.5 bg-gradient-to-r from-aqua to-blush text-ink-900 rounded-2xl font-bold shadow-soft transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(94,240,255,0.4)] uppercase tracking-wider text-xs">
            Deploy New Agent
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: 'Active Negotiations', value: activeDeals.length, icon: <TrendingUp className="text-aqua" /> },
            { label: 'Settled Deals', value: completedDeals.length, icon: <CheckCircle2 className="text-lime" /> }
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
          {actionStatus && (
            <div className="text-[10px] font-mono uppercase tracking-widest text-aqua/60 bg-aqua/5 p-4 rounded-xl border border-aqua/10">
              <span className="w-2 h-2 rounded-full bg-aqua inline-block mr-2 animate-pulse" />
              {actionStatus}
            </div>
          )}

          {dealsNeedingYourApproval.length > 0 && (
            <div className="space-y-4">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-slate">Proposals Awaiting Authorization</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dealsNeedingYourApproval.map((deal) => {
                  const request = deal.data?.request || deal.data || {};
                  const buyerWallet = request?.buyer_wallet || '';
                  const sellerWallet = deal.data?.seller_wallet || '';
                  const role = account && account.toLowerCase() === buyerWallet.toLowerCase() ? 'buyer' : account && account.toLowerCase() === sellerWallet.toLowerCase() ? 'seller' : null;
                  const canAct = Boolean(role);
                  return (
                  <div key={deal.id} className="p-6 rounded-2xl bg-ink-800/40 border border-white/10 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-lg font-bold text-white">{deal.title}</div>
                        <div className="text-sm text-slate flex items-center gap-1 mt-1">
                          <Coins size={12} className="text-aqua" /> {deal.price} XLM
                        </div>
                      </div>
                      <div className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-slate uppercase tracking-wider border border-white/10">
                        Agent Closed
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(deal)}
                        disabled={actionLoading || !canAct}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-aqua/20 to-blush/20 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:border-aqua/50 transition-all"
                      >
                        Authorize Escrow
                      </button>
                      <button
                        onClick={() => handleReject(deal)}
                        disabled={actionLoading || !canAct}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Decline
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
              className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-aqua text-ink-900 shadow-lg' : 'text-slate hover:text-white'}`}
            >
              Protocol Active
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'completed' ? 'bg-blush text-ink-900 shadow-lg' : 'text-slate hover:text-white'}`}
            >
              History
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
                  className="group relative bg-ink-800/40 border border-white/10 rounded-[2rem] p-8 hover:bg-ink-800/60 transition-all hover:border-white/20 flex flex-col justify-between min-h-[240px]"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border ${
                        deal.status === 'Completed' ? 'bg-lime/10 border-lime/20 text-lime' : 'bg-aqua/10 border-aqua/20 text-aqua'
                      }`}>
                        {deal.status}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-aqua transition-colors line-clamp-2">{deal.title}</h3>
                    <div className="text-2xl font-display font-bold text-white/90 flex items-center gap-1">
                      <Coins size={18} className="text-aqua" /> {deal.price} XLM
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={() => navigate(deal.route, { state: { dealId: deal.id } })}
                      className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 group/btn"
                    >
                      {deal.actionLabel} <ArrowRight size={12} className="group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {currentDeals.length === 0 && (activeTab !== 'active' || deals.length === 0) && (
            <div className="text-center py-20 bg-ink-800/20 rounded-[3rem] border border-dashed border-white/10">
              <LayoutDashboard size={48} className="mx-auto text-slate/20 mb-4" />
              <p className="text-slate font-display italic">Awaiting protocol deployment...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
