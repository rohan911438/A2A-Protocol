# A2A Protocol

Autonomous agent-to-agent negotiation platform with a FastAPI backend and a React (Vite) frontend, integrated with Stellar testnet flows.

## Live Deployment

- Frontend URL: https://a2aprotocol.netlify.app/
- Backend URL: https://a2a-protocol-rn62.onrender.com
- Backend health check: https://a2a-protocol-rn62.onrender.com/

## Stellar Contract Configuration

- Escrow contract (CONTRACT_ID): `CDKOZ25IENHQFRRNTJDXAYAOUSDBPUXLE52UGTNIPWACAMGAMNXMYTQU`
- Token contract (TOKEN_CONTRACT_ID): `CB5YMKKIGH7UFLWDNZRH5P5ENXE7VQIOJSA2FDVQQB3Z7AEUIFQOEFTI`
- Network: Stellar Testnet (`Test SDF Network ; September 2015`)

## Prerequisites

- Python 3.11
- Node.js 20+
- npm

## Local Backend Setup

1. Install dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```
2. Configure environment in root `.env` (API keys, contract IDs, wallets).
3. Run backend:
   ```bash
   python -m backend.main
   ```
4. Local API base URL:
   ```text
   http://127.0.0.1:8000
   ```

## Frontend Setup (Local)

1. Move to frontend:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `frontend/.env` with:
   ```env
   VITE_API_BASE=http://127.0.0.1:8000
   VITE_HORIZON_URL=https://horizon-testnet.stellar.org
   VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
   VITE_STELLAR_NETWORK=TESTNET
   ```
4. Run frontend:
   ```bash
   npm run dev
   ```

## Frontend Deployment (Netlify)

The repository already includes `netlify.toml` configured with:
- Base directory: `frontend`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`

Set these Netlify environment variables:

```env
VITE_API_BASE=https://a2a-protocol-rn62.onrender.com
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_STELLAR_NETWORK=TESTNET
```

After deploy, add your Netlify domain to backend CORS (`CORS_ORIGINS`) in Render.

Current production frontend domain:

```text
https://a2aprotocol.netlify.app/
```

## Project Structure

- `backend/`: FastAPI routes, services, persistence, Stellar integration.
- `frontend/`: React + Vite UI.
- `smart_contract/`: Soroban contract code.
- `Agents/`: negotiation and strategy agents.
