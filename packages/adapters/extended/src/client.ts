const BASE_URL = 'https://api.starknet.extended.exchange';

export type ExtendedPosition = {
  id: string;
  accountId: string;
  market: string;          // "BTC-USD"
  side: 'LONG' | 'SHORT';
  leverage: string;
  size: string;
  value: string;           // notional USD
  openPrice: string;
  markPrice: string;
  liquidationPrice: string;
  margin: string;
  unrealisedPnl: string;
  realisedPnl: string;
  createdTime: number;     // unix ms
  updatedTime: number;
};

async function get<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'X-Api-Key': apiKey,
      'User-Agent': 'perpdeck/0.1',
    },
  });
  if (!res.ok) {
    throw new Error(`Extended API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getPositions(apiKey: string): Promise<ExtendedPosition[]> {
  const data = await get<{ data: ExtendedPosition[] }>('/api/v1/user/positions', apiKey);
  return data.data ?? [];
}
