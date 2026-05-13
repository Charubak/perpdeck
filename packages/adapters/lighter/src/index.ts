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
import { getAccountPositions, getOrderBookDetails } from './client.js';

// Lighter is on zkSync (EVM-compatible). Same address format as Ethereum.
// LIGHTER_API_KEY env var is required to read positions — Lighter's position
// endpoint requires an Authorization token. Without it the adapter returns empty
// positions rather than crashing the aggregator.
const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export class LighterAdapter implements PortfolioAdapter {
  readonly protocol = Protocol.LIGHTER;
  readonly chain = Chain.ZKSYNC;
  readonly version = '2024-01';

  private readonly apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  supports(address: Address): boolean {
    return EVM_ADDRESS_RE.test(address);
  }

  async getPositions(address: Address): Promise<Position[]> {
    const raw = await getAccountPositions(address, this.apiKey);
    const positions: Position[] = [];

    for (const p of raw) {
      const sign = p.sign >= 0 ? 1 : -1;
      const side = sign > 0 ? 'long' : 'short';
      const size = Math.abs(parseFloat(p.position));
      if (size === 0) continue;

      const entryPrice = parseFloat(p.avg_entry_price);
      const notional = parseFloat(p.position_value);
      const unrealizedPnl = parseFloat(p.unrealized_pnl);

      // Derive mark price from pnl + entry; enrich below if symbol known
      const markPrice = size > 0 ? entryPrice + (unrealizedPnl / size) * sign : entryPrice;
      const liqPx = p.liquidation_price ? parseFloat(p.liquidation_price) : null;

      // Lighter symbols come as "BTC-USD" — normalize to "BTC-PERP" convention
      const symbol = p.symbol.replace('-USD', '-PERP');

      positions.push({
        id: `${Protocol.LIGHTER}:${symbol}:${side}`,
        protocol: Protocol.LIGHTER,
        symbol,
        side,
        size,
        notional,
        entryPrice,
        markPrice,
        leverage: notional / parseFloat(p.allocated_margin || '1'),
        marginMode: p.margin_mode,
        unrealizedPnl,
        fundingPaid: parseFloat(p.total_funding_paid_out ?? '0'),
        liquidationPrice: liqPx,
        openedAt: null,
      });
    }

    // Enrich mark prices from order book
    const symbols = [...new Set(positions.map((p) => p.symbol.replace('-PERP', '-USD')))];
    await Promise.allSettled(
      symbols.map(async (sym) => {
        try {
          const ob = await getOrderBookDetails(sym);
          const mark = parseFloat(ob.mark_price);
          const perpSym = sym.replace('-USD', '-PERP');
          for (const pos of positions) {
            if (pos.symbol === perpSym) pos.markPrice = mark;
          }
        } catch {
          // non-fatal
        }
      }),
    );

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
    const lighterSym = symbol.replace('-PERP', '-USD');
    const ob = await getOrderBookDetails(lighterSym);
    return parseFloat(ob.mark_price);
  }
}

export const lighterAdapter = new LighterAdapter(process.env['LIGHTER_API_KEY']);
