import type { Protocol } from './protocol.js';

export type Address = string;

export type MarginMode = 'cross' | 'isolated';

export type Position = {
  id: string;               // stable: `${protocol}:${symbol}:${side}`
  protocol: Protocol;
  symbol: string;           // "BTC-PERP", "SOL-PERP"
  side: 'long' | 'short';
  size: number;             // base asset units
  notional: number;         // USD
  entryPrice: number;
  markPrice: number;
  leverage: number;
  marginMode: MarginMode;
  unrealizedPnl: number;
  fundingPaid: number;      // cumulative since open (best-effort; 0 if unavailable)
  liquidationPrice: number | null;
  openedAt: number | null;  // unix ms; null if protocol doesn't expose
};

export type Balance = {
  protocol: Protocol;
  asset: string;
  amount: number;
  usdValue: number;
};

export type FundingPayment = {
  protocol: Protocol;
  symbol: string;
  amount: number;   // USD, negative = paid out, positive = received
  rate: number;     // funding rate at time of payment
  paidAt: number;   // unix ms
};

export type Fill = {
  protocol: Protocol;
  symbol: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  fee: number;
  filledAt: number; // unix ms
};

export type PortfolioSummary = {
  totalNotional: number;
  totalUnrealizedPnl: number;
  totalFundingPaid: number;
  netDelta: number;         // long notional - short notional
  positions: Position[];
  balances: Balance[];
  updatedAt: number;        // unix ms
  adapterHealth: Record<Protocol, AdapterStatus>;
};

export type AdapterStatus = {
  healthy: boolean;
  lastSuccessAt: number | null;
  error: string | null;
};
