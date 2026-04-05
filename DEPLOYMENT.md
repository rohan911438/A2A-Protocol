# Deployment Guide

## Frontend: Netlify

Deploy the `frontend/` app to Netlify.

### Build settings
- Base directory: `frontend`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`

### Required environment variables
- `VITE_API_BASE` = your Render backend URL, for example `https://a2a-protocol-backend.onrender.com`
- `VITE_HORIZON_URL` = `https://horizon-testnet.stellar.org`
- `VITE_NETWORK_PASSPHRASE` = `Test SDF Network ; September 2015`

### SPA routing
The repository includes a root [netlify.toml](netlify.toml) with an index redirect so React Router routes work on refresh.

## Backend: Render

Deploy the FastAPI backend using the root [render.yaml](render.yaml).

### Service settings
- Runtime: Python
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

### Required environment variables
- `CORS_ORIGINS` = comma-separated allowed origins, for example `http://localhost:5173,https://your-site.netlify.app`
- `VITE_HORIZON_URL` = `https://horizon-testnet.stellar.org`
- `VITE_NETWORK_PASSPHRASE` = `Test SDF Network ; September 2015`
- `DEFAULT_SELLER_WALLET` = seller Stellar public key
- `GEMINI_API_KEY` or `GOOGLE_API_KEY` = required for negotiation runs

### Notes
- The backend writes SQLite data under `backend/data/a2a_protocol.db`.
- For Render, use persistent disk storage if you need the database to survive redeploys.
- x402 payment state, reasoning logs, and smart deal summaries are stored locally in SQLite and keyed by wallet + deal ID.
