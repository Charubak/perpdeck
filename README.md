# perpdeck

Unified perp DEX portfolio dashboard. Paste a wallet address and see all open positions across Hyperliquid, dYdX, GMX, Drift, Jupiter, and more in one live view.

**Read-only.** No signing, no custody, no transactions. Public on-chain data only.

## Supported protocols

| Protocol | Chain | Status |
|---|---|---|
| Hyperliquid | Hyperliquid L1 | Phase 1 |
| dYdX v4 | dYdX Chain | Phase 1 |
| GMX v2 | Arbitrum / Avalanche | Phase 1 |
| Drift | Solana | Phase 2 |
| Jupiter Perps | Solana | Phase 2 |
| Pacifica | Solana | Phase 2 |
| Paradex | Starknet | Phase 3 |
| Extended | Starknet | Phase 3 |
| Lighter | zkSync | Phase 4 |
| Aster | BNB Chain | Phase 4 |
| Avantis | Base | Phase 4 |
| Hibachi | Ethereum L2 | Phase 4 |
| Variational | Ethereum | Phase 4 |

## Repo structure

```
apps/
  api/       Fastify + WebSocket backend (Railway)
  web/       Vite + React + Tailwind frontend (Vercel)
packages/
  shared/           canonical types + PnL math
  adapters/_base/   PortfolioAdapter interface + registry
  adapters/<name>/  one folder per protocol
  db/               Drizzle schema + migrations
```

## Local dev

```bash
cp .env.example .env.local   # fill in API keys
npm install
npm run dev:api               # :3001
npm run dev:web               # :5173
```

Visit `http://localhost:5173`, paste a wallet address.

## Architecture

Every protocol is wrapped in a `PortfolioAdapter` (see [`packages/adapters/_base/src/PortfolioAdapter.ts`](packages/adapters/_base/src/PortfolioAdapter.ts)) that exposes a uniform interface: `getPositions`, `getBalances`, `getFundingHistory`, `getFills`, `getMarkPrice`. The aggregation layer fans out an address to every adapter whose `supports()` returns true, collects results via `Promise.allSettled` (so one broken adapter doesn't kill the response), and computes portfolio-level PnL.

PnL math lives in [`packages/shared/src/pnl.ts`](packages/shared/src/pnl.ts) as pure functions — same logic across all protocols.

## Adding a new adapter

1. Create `packages/adapters/<name>/src/index.ts` implementing `PortfolioAdapter`
2. Add a `supports(address)` guard for the protocol's address format
3. Add snapshot tests in `__tests__/` against a known public address
4. Register in `apps/api/src/index.ts` via `registerAdapter()`

## License

MIT
