const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Request failed')
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

export async function acceptDeal(deal_id) {
  return request(`/deal/${deal_id}/accept`, {
    method: 'POST',
  })
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
