const DEFAULT_PROD_API_BASE = 'https://a2a-protocol-rn62.onrender.com'
const API_BASE = (
  import.meta.env.VITE_API_BASE
  || (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')
    ? DEFAULT_PROD_API_BASE
    : 'http://127.0.0.1:8000')
).replace(/\/$/, '')

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
    const error = new Error(errorData.detail?.message || errorData.detail || 'Request failed');
    error.payload = errorData;
    throw error;
  }

  return response.json()
}

export async function getContractInfo() {
  return request('/contract/info')
}

export async function getCreateDealTxn(sender, deal_id, total, milestones) {
  return request('/contract/create-txn', {
    method: 'POST',
    body: JSON.stringify({ sender, deal_id, total, milestones }),
  })
}

export async function getReleaseTxn(sender, deal_id, milestone_index, amount, destination) {
  return request('/contract/release-txn', {
    method: 'POST',
    body: JSON.stringify({ sender, deal_id, milestone_index, amount, destination }),
  })
}

export async function submitSignedXdr(xdr) {
  return request('/contract/submit', {
    method: 'POST',
    body: JSON.stringify({ xdr }),
  })
}

export async function getWalletBalance(address) {
  return request(`/wallet/balance?address=${encodeURIComponent(address)}`)
}
