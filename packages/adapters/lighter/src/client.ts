const BASE_URL = 'https://mainnet.zklighter.elliot.ai';

export type LighterPosition = {
  market_id: number;
  symbol: string;
  sign: number;          // +1 = long, -1 = short
  position: string;      // base asset units
  avg_entry_price: string;
  position_value: string;
  unrealized_pnl: string;
  realized_pnl: string;
  liquidation_price: string | null;
  margin_mode: 'cross' | 'isolated';
  allocated_margin: string;
  total_funding_paid_out: string;
};

export type LighterAccountResponse = {
  account_index: number;
  l1_address: string;
  positions: LighterPosition[];
};

export type LighterOrderBookDetails = {
  symbol: string;
  mark_price: string;
  index_price: string;
  funding_rate: string;
};

async function get<T>(path: string, apiKey?: string): Promise<T | null> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = apiKey;

  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (res.status === 401 || res.status === 403) return null; // no key or invalid key
  if (!res.ok) throw new Error(`Lighter API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function getAccountPositions(
  address: string,
  apiKey?: string,
): Promise<LighterPosition[]> {
  const data = await get<LighterAccountResponse>(
    `/api/v1/accounts/${address.toLowerCase()}/positions`,
    apiKey,
  );
  return data?.positions ?? [];
}

export async function getOrderBookDetails(symbol: string): Promise<LighterOrderBookDetails> {
  return get<LighterOrderBookDetails>(`/api/v1/orderBookDetails?symbol=${symbol}`);
}
