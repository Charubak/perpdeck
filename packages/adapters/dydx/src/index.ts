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
import { getSubaccounts, getMarkets } from './client.js';

// dYdX v4 uses Cosmos bech32 addresses: "dydx1" + ~38 alphanumeric chars
const DYDX_ADDRESS_RE = /^dydx1[a-z0-9]{38,}$/;

export class DydxAdapter implements PortfolioAdapter {
  readonly protocol = Protocol.DYDX;
  readonly chain = Chain.DYDX_CHAIN;
  readonly version = 'v4-indexer';

  supports(address: Address): boolean {
    return DYDX_ADDRESS_RE.test(address);
  }

  async getPositions(address: Address): Promise<Position[]> {
    const [subaccounts, markets] = await Promise.all([
      getSubaccounts(address),
      getMarkets(),
    ]);

    const positions: Position[] = [];

    for (const sub of subaccounts) {
      for (const pos of Object.values(sub.openPerpetualPositions)) {
        if (pos.status !== 'OPEN') continue;

        const size = parseFloat(pos.size);
        if (size === 0) continue;

        const side = pos.side === 'LONG' ? 'long' : 'short';
        const entryPrice = parseFloat(pos.entryPrice);
        const symbol = pos.market.replace('-USD', '-PERP');

        // Mark price from oracle
        const marketData = markets[pos.market];
        const markPrice = marketData ? parseFloat(marketData.oraclePrice) : entryPrice;
        const notional = size * markPrice;

        positions.push({
          id: `${Protocol.DYDX}:${symbol}:${side}:${sub.subaccountNumber}`,
          protocol: Protocol.DYDX,
          symbol,
          side,
          size,
          notional,
          entryPrice,
          markPrice,
          leverage: notional / parseFloat(sub.freeCollateral || '1'),
          marginMode: 'cross',
          unrealizedPnl: parseFloat(pos.unrealizedPnl),
          fundingPaid: parseFloat(pos.netFunding ?? '0'),
          liquidationPrice: null,
          openedAt: pos.createdAt ? new Date(pos.createdAt).getTime() : null,
        });
      }
    }

    return positions;
  }

  async getBalances(address: Address): Promise<Balance[]> {
    const subaccounts = await getSubaccounts(address);
    return subaccounts.map((sub) => ({
      protocol: Protocol.DYDX,
      asset: `USDC (sub${sub.subaccountNumber})`,
      amount: parseFloat(sub.equity),
      usdValue: parseFloat(sub.equity),
    }));
  }

  async getFundingHistory(_address: Address, _since: number): Promise<FundingPayment[]> {
    return [];
  }

  async getFills(_address: Address, _since: number): Promise<Fill[]> {
    return [];
  }

  async getMarkPrice(symbol: string): Promise<number> {
    const markets = await getMarkets();
    const key = symbol.replace('-PERP', '-USD');
    const market = markets[key];
    if (!market) throw new Error(`Unknown dYdX market: ${symbol}`);
    return parseFloat(market.oraclePrice);
  }
}

export const dydxAdapter = new DydxAdapter();
