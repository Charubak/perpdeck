import type { PortfolioAdapter } from '@perpdeck/adapters-base';
import {
  Protocol,
  Chain,
  type Address,
  type Position,
  type Balance,
  type FundingPayment,
  type Fill,
} from '@perpdeck/shared';
import { getPositions as fetchPositions } from './client.js';

// Extended is on Starknet. Starknet addresses are 0x + up to 64 hex chars (felt252).
// They're 66 chars when zero-padded, but shorter forms are also valid.
// They don't match the 40-char EVM pattern.
//
// EXTENDED_API_KEY env var is required — Extended's positions endpoint is
// tied to an authenticated sub-account, not derivable from address alone.
// Without it the adapter reports healthy but returns empty positions.
const STARKNET_ADDRESS_RE = /^0x[0-9a-fA-F]{1,64}$/;

function isStarknetAddress(address: string): boolean {
  return STARKNET_ADDRESS_RE.test(address) && address.length > 42;
}

export class ExtendedAdapter implements PortfolioAdapter {
  readonly protocol = Protocol.EXTENDED;
  readonly chain = Chain.STARKNET;
  readonly version = '2024-01';

  private readonly apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  supports(address: Address): boolean {
    return isStarknetAddress(address);
  }

  async getPositions(_address: Address): Promise<Position[]> {
    if (!this.apiKey) return [];

    const raw = await fetchPositions(this.apiKey);
    const positions: Position[] = [];

    for (const p of raw) {
      const size = parseFloat(p.size);
      if (size === 0) continue;

      const side = p.side === 'LONG' ? 'long' : 'short';
      const symbol = p.market.replace('-USD', '-PERP');

      positions.push({
        id: `${Protocol.EXTENDED}:${symbol}:${side}`,
        protocol: Protocol.EXTENDED,
        symbol,
        side,
        size,
        notional: parseFloat(p.value),
        entryPrice: parseFloat(p.openPrice),
        markPrice: parseFloat(p.markPrice),
        leverage: parseFloat(p.leverage),
        marginMode: 'cross',
        unrealizedPnl: parseFloat(p.unrealisedPnl),
        fundingPaid: 0,
        liquidationPrice: parseFloat(p.liquidationPrice) || null,
        openedAt: p.createdTime ?? null,
      });
    }

    return positions;
  }

  async getBalances(_address: Address): Promise<Balance[]> {
    return [];
  }

  async getFundingHistory(_address: Address, _since: number): Promise<FundingPayment[]> {
    return [];
  }

  async getFills(_address: Address, _since: number): Promise<Fill[]> {
    return [];
  }

  async getMarkPrice(symbol: string): Promise<number> {
    if (!this.apiKey) throw new Error('EXTENDED_API_KEY not set');
    const positions = await fetchPositions(this.apiKey);
    const match = positions.find((p) => p.market === symbol.replace('-PERP', '-USD'));
    if (!match) throw new Error(`No mark price for ${symbol}`);
    return parseFloat(match.markPrice);
  }
}

export const extendedAdapter = new ExtendedAdapter(process.env['EXTENDED_API_KEY']);
