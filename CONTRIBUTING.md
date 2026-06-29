# Contributing to A2A Protocol

Thank you for your interest in contributing.

## Getting Started

1. Fork the repository and clone your fork.
2. Copy `.env.example` to `.env` and fill in the required values.
3. Install backend dependencies: `pip install -r requirements.txt`
4. Install frontend dependencies: `cd frontend && npm install`
5. Run backend: `python -m backend.main`
6. Run frontend: `cd frontend && npm run dev`

## What to Work On

Check [GitHub Issues](https://github.com/rohan911438/A2A-Protocol/issues) for open items. Issues labeled `good first issue` are suitable for new contributors.

High-priority areas:
- Additional negotiation strategies in `Agents/strategy.py`
- Frontend mobile responsiveness improvements
- Soroban contract: multi-verifier quorum support
- Backend: persistent storage upgrade (PostgreSQL)
- Test coverage for backend routes

## Pull Request Guidelines

- Keep PRs focused on a single concern.
- Include a clear description of what changed and why.
- Ensure `python -m compileall backend Agents` passes.
- Ensure `cd frontend && npm run build` passes.
- Reference the relevant issue number if applicable.

## Code Style

- Python: follow PEP 8. Use type hints on function signatures.
- JavaScript/JSX: follow the existing ESLint config.
- Rust: run `cargo fmt` before committing smart contract changes.

## Security Issues

Do not open a public issue for security vulnerabilities. Use the `security` label on a private GitHub Issue or contact the team directly.
