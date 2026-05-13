// dYdX v4 Indexer API — fully public, no auth required
const BASE_URL = 'https://indexer.dydx.trade/v4';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`dYdX API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export type DydxPerpetualPosition = {
  market: string;           // "BTC-USD"
  status: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
  side: 'LONG' | 'SHORT';
  size: string;
  maxSize: string;
  entryPrice: string;
  exitPrice: string | null;
  realizedPnl: string;
  unrealizedPnl: string;
  createdAt: string;        // ISO 8601
  closedAt: string | null;
  sumOpen: string;
  sumClose: string;
  netFunding: string;
  subaccountNumber: number;
};

export type DydxSubaccount = {
  address: string;
  subaccountNumber: number;
  equity: string;
  freeCollateral: string;
  openPerpetualPositions: Record<string, DydxPerpetualPosition>;
};

export type DydxAddressResponse = {
  subaccounts: DydxSubaccount[];
};

export type DydxMarket = {
  market: string;
  oraclePrice: string;
  priceChange24H: string;
  volume24H: string;
  nextFundingRate: string;
};

export type DydxMarketsResponse = {
  markets: Record<string, DydxMarket>;
};

export async function getSubaccounts(address: string): Promise<DydxSubaccount[]> {
  const data = await get<DydxAddressResponse>(`/addresses/${address}`);
  return data.subaccounts ?? [];
}

export async function getMarkets(): Promise<Record<string, DydxMarket>> {
  const data = await get<DydxMarketsResponse>('/perpetualMarkets');
  return data.markets ?? {};
}
