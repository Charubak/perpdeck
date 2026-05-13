const BASE_URL = 'https://api.hyperliquid.xyz';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Hyperliquid API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export type HlClearinghouseState = {
  assetPositions: Array<{
    position: {
      coin: string;
      szi: string;         // signed size (positive = long, negative = short)
      entryPx: string;
      positionValue: string;
      unrealizedPnl: string;
      returnOnEquity: string;
      liquidationPx: string | null;
      leverage: {
        type: 'cross' | 'isolated';
        value: number;
      };
      cumFunding: {
        allTime: string;
        sinceOpen: string;
        sinceChange: string;
      };
    };
    type: string;
  }>;
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
};

export type HlMeta = {
  universe: Array<{
    name: string;
    szDecimals: number;
    maxLeverage: number;
  }>;
};

export type HlMetaAndAssetCtxs = [HlMeta, Array<{ markPx: string; midPx: string | null; funding: string }>];

export async function getClearinghouseState(address: string): Promise<HlClearinghouseState> {
  return post<HlClearinghouseState>('/info', {
    type: 'clearinghouseState',
    user: address.toLowerCase(),
  });
}

export async function getMetaAndAssetCtxs(): Promise<HlMetaAndAssetCtxs> {
  return post<HlMetaAndAssetCtxs>('/info', { type: 'metaAndAssetCtxs' });
}
