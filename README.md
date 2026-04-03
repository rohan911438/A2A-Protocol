# Agentic Exchange

An autonomous agent negotiation platform built on Algorand. This project consists of a FastAPI backend and a React (Vite) frontend.

## Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **npm** (comes with Node.js)

## Getting Started

### 1. Backend Setup

The backend handles the core logic, agent negotiations, and data persistence.

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory (parent of `backend/`) if needed for API keys or database connections.

3. **Run the server**:
   From the project root directory, run:
   ```bash
   python -m backend.main
   ```
   The backend will be available at `http://127.0.0.1:8000`.

### 2. Frontend Setup

The frontend provides the user interface for interacting with the platform.

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   The frontend will be available at the URL provided in the console (usually `http://localhost:5173`).

## Project Structure

- `backend/`: FastAPI application containing routes, models, and services.
- `frontend/`: React application built with Vite and Tailwind CSS.
- `smart_contract/`: Algorand smart contracts (PyTeal).
- `Agents/`: Agent-specific logic and configurations.
# Stellar
