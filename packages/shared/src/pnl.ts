import type { Position, FundingPayment } from './position.js';

export function calcUnrealizedPnl(position: Pick<Position, 'side' | 'size' | 'markPrice' | 'entryPrice'>): number {
  const { side, size, markPrice, entryPrice } = position;
  if (side === 'long') {
    return size * (markPrice - entryPrice);
  }
  return size * (entryPrice - markPrice);
}

export function calcTotalUnrealizedPnl(positions: Position[]): number {
  return positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
}

export function calcTotalFundingPaid(positions: Position[]): number {
  return positions.reduce((sum, p) => sum + p.fundingPaid, 0);
}

export function calcNetDelta(positions: Position[]): number {
  return positions.reduce((delta, p) => {
    return p.side === 'long' ? delta + p.notional : delta - p.notional;
  }, 0);
}

export function calcTotalNotional(positions: Position[]): number {
  return positions.reduce((sum, p) => sum + p.notional, 0);
}

export function calcFundingPaidSince(payments: FundingPayment[], since: number): number {
  return payments
    .filter((p) => p.paidAt >= since)
    .reduce((sum, p) => sum + p.amount, 0);
}

export function liquidationProximityPct(position: Pick<Position, 'side' | 'markPrice' | 'liquidationPrice'>): number | null {
  const { side, markPrice, liquidationPrice } = position;
  if (liquidationPrice === null || markPrice === 0) return null;
  if (side === 'long') {
    return ((markPrice - liquidationPrice) / markPrice) * 100;
  }
  return ((liquidationPrice - markPrice) / markPrice) * 100;
}
