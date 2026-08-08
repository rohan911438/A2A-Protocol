const DEFAULT_PROD_API_BASE = 'https://a2a-protocol-rn62.onrender.com'
const API_BASE = (
  import.meta.env.VITE_API_BASE
  || (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')
    ? DEFAULT_PROD_API_BASE
    : 'http://127.0.0.1:8000')
).replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    let message = 'Request failed'
    let payload = null
    try {
      const data = await response.json()
      payload = data
      if (Array.isArray(data?.detail) && data.detail.length > 0) {
        const first = data.detail[0]
        message = first?.msg || message
      } else if (data?.detail && typeof data.detail === 'object') {
        message = data.detail.message || data.detail.status || message
      } else {
        message = data?.detail || data?.message || message
      }
    } catch {
      const text = await response.text()
      message = text || message
    }
    const error = new Error(String(message))
    error.payload = payload
    throw error
  }

  return response.json()
}

export async function createDeal(payload) {
  return request('/create-deal', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function startNegotiation(deal_id) {
  return request('/start-negotiation', {
    method: 'POST',
    body: JSON.stringify({ deal_id }),
  })
}

export async function getDeal(id) {
  return request(`/deal/${id}`)
}

export async function listDeals() {
  return request('/deals')
}

export async function acceptDealWithWallet(deal_id, seller_wallet) {
  return request(`/deal/${deal_id}/accept`, {
    method: 'POST',
    body: JSON.stringify({ seller_wallet }),
  })
}

export async function approveDeal(deal_id, role) {
  return request(`/deal/${deal_id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  })
}

export async function rejectDeal(deal_id, role) {
  return request(`/deal/${deal_id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  })
}

export async function recordOnchainAccept(deal_id, role, txid) {
  return request(`/deal/${deal_id}/onchain-accept`, {
    method: 'POST',
    body: JSON.stringify({ role, txid }),
  })
}

export async function fundDeal(deal_id, txid) {
  return request(`/deal/${deal_id}/fund`, {
    method: 'POST',
    body: JSON.stringify({ txid }),
  })
}

export async function recordRelease(deal_id, milestone_index, txid) {
  return request(`/deal/${deal_id}/release`, {
    method: 'POST',
    body: JSON.stringify({ milestone_index, txid }),
  })
}

export async function completeDeal(deal_id) {
  return request(`/deal/${deal_id}/complete`, {
    method: 'POST',
  })
}

export async function getSmartDealSummary(deal_id, wallet_address) {
  const walletQuery = wallet_address ? `?wallet_address=${encodeURIComponent(wallet_address)}` : ''
  return request(`/deal/${deal_id}/smart-summary${walletQuery}`)
}

export async function getDealX402Status(deal_id, wallet_address, purpose = 'escrow_authorization_fee') {
  const query = `?wallet_address=${encodeURIComponent(wallet_address)}&purpose=${encodeURIComponent(purpose)}`
  return request(`/deal/${deal_id}/x402-status${query}`)
}

export async function recordDealX402Payment(deal_id, payload) {
  return request(`/deal/${deal_id}/x402-payment`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
