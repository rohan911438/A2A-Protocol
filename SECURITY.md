# Security Policy

## Supported Versions

A2A Protocol is currently in testnet stage. All active development is on the `main` branch.

## Reporting a Vulnerability

**Do not** create a public GitHub Issue for security vulnerabilities - this
repository is public, so a public Issue discloses the bug to everyone before
it can be fixed.

To report a vulnerability:
1. Use GitHub's private vulnerability reporting: open the repository's
   **Security** tab and select **Report a vulnerability**. This creates a
   private draft security advisory visible only to the maintainer, not a
   public Issue.
2. Describe the vulnerability clearly: what it is, how to reproduce it, and
   potential impact.
3. We will acknowledge within 48 hours and provide a fix timeline.
4. Do not publish details publicly until a patch is released.

## Scope

| In scope | Out of scope |
|---|---|
| Soroban smart contract bugs that could allow unauthorized fund access | Issues requiring physical access to a device |
| Backend API endpoints that leak private data | Bugs in third-party services (Gemini API, Horizon) |
| Wallet signing flow vulnerabilities | Social engineering attacks |
| x402 payment verification bypass | Issues in development/testnet mode only |

## Known Limitations (Not Vulnerabilities)

- x402 is in `simulate` mode by default — this is intentional for demos.
- Smart contracts are on Stellar Testnet, not Mainnet.
- SQLite data is not persistent across Render free-tier redeploys.
