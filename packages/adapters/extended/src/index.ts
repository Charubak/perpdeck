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

// Extended is on Starknet, but its positions endpoint is API-key-scoped, not
// address-scoped. The API key determines which sub-account's positions are returned;
// the wallet address is only used to decide whether to call this adapter at all.
// Users typically connect via their EVM wallet (MetaMask), so we accept EVM addresses
// when EXTENDED_API_KEY is configured. Starknet addresses (>42 chars) also work.
//
// Without EXTENDED_API_KEY the adapter returns empty — there is no public read path.
const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const STARKNET_ADDRESS_RE = /^0x[0-9a-fA-F]{41,64}$/;

export class ExtendedAdapter implements PortfolioAdapter {
  readonly protocol = Protocol.EXTENDED;
  readonly chain = Chain.STARKNET;
  readonly version = '2024-01';

  private readonly apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  supports(address: Address): boolean {
    const key = this.apiKey ?? process.env['EXTENDED_API_KEY'];
    if (!key) return false; // no key = no data, don't waste a slot in the fan-out
    return EVM_ADDRESS_RE.test(address) || STARKNET_ADDRESS_RE.test(address);
  }

  async getPositions(_address: Address): Promise<Position[]> {
    const apiKey = this.apiKey ?? process.env['EXTENDED_API_KEY'];
    if (!apiKey) return [];

    const raw = await fetchPositions(apiKey);
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
