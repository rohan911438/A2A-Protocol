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

export async function getContractInfo() {
  return request('/contract/info')
}

export async function getCreateDealTxn(sender, deal_id, total, milestones) {
  return request('/contract/create-txn', {
    method: 'POST',
    body: JSON.stringify({ sender, deal_id, total, milestones }),
  })
}

export async function getAcceptTxnForDeal(sender, deal_id) {
  return request('/contract/accept-txn', {
    method: 'POST',
    body: JSON.stringify({ sender, deal_id }),
  })
}

export async function getDepositTxns(sender, deal_id, amount) {
  return request('/contract/deposit-txn', {
    method: 'POST',
    body: JSON.stringify({ sender, deal_id, amount }),
  })
}

export async function getReleaseTxn(sender, deal_id, milestone_index, seller) {
  return request('/contract/release-txn', {
    method: 'POST',
    body: JSON.stringify({ sender, deal_id, milestone_index, seller }),
  })
}

export async function submitSignedTxns(signedTxns) {
  return request('/contract/submit', {
    method: 'POST',
    body: JSON.stringify({ signed_txns: signedTxns }),
  })
}

export async function getWalletBalance(address) {
  return request(`/wallet/balance?address=${encodeURIComponent(address)}`)
}
