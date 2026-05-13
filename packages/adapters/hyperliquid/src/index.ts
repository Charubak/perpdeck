import type { PortfolioAdapter, Unsubscribe } from '@perpdeck/adapters-base';
import { Protocol, Chain, type Address, type Position, type Balance, type FundingPayment, type Fill } from '@perpdeck/shared';
import { getClearinghouseState, getMetaAndAssetCtxs } from './client.js';

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export class HyperliquidAdapter implements PortfolioAdapter {
  readonly protocol = Protocol.HYPERLIQUID;
  readonly chain = Chain.HYPERLIQUID_L1;
  readonly version = '2024-01';

  supports(address: Address): boolean {
    return EVM_ADDRESS_RE.test(address);
  }

  async getPositions(address: Address): Promise<Position[]> {
    const state = await getClearinghouseState(address);
    const positions: Position[] = [];

    for (const { position } of state.assetPositions) {
      const szi = parseFloat(position.szi);
      if (szi === 0) continue;

      const side = szi > 0 ? 'long' : 'short';
      const size = Math.abs(szi);
      const entryPrice = parseFloat(position.entryPx);
      const notional = parseFloat(position.positionValue);
      const unrealizedPnl = parseFloat(position.unrealizedPnl);
      const fundingPaid = parseFloat(position.cumFunding.sinceOpen);
      const liqPx = position.liquidationPx !== null ? parseFloat(position.liquidationPx) : null;

      positions.push({
        id: `${Protocol.HYPERLIQUID}:${position.coin}-PERP:${side}`,
        protocol: Protocol.HYPERLIQUID,
        symbol: `${position.coin}-PERP`,
        side,
        size,
        notional,
        entryPrice,
        markPrice: notional / size,  // approximation; refined by getMarkPrice
        leverage: position.leverage.value,
        marginMode: position.leverage.type,
        unrealizedPnl,
        fundingPaid,
        liquidationPrice: liqPx,
        openedAt: null,
      });
    }

    // Enrich mark prices from metaAndAssetCtxs
    try {
      const [meta, ctxs] = await getMetaAndAssetCtxs();
      const priceMap = new Map<string, number>();
      meta.universe.forEach((asset, i) => {
        const ctx = ctxs[i];
        if (ctx) priceMap.set(asset.name, parseFloat(ctx.markPx));
      });
      for (const pos of positions) {
        const coin = pos.symbol.replace('-PERP', '');
        const mark = priceMap.get(coin);
        if (mark !== undefined) pos.markPrice = mark;
      }
    } catch {
      // non-fatal: positions already have approximate mark prices
    }

    return positions;
  }

  async getBalances(address: Address): Promise<Balance[]> {
    const state = await getClearinghouseState(address);
    const accountValue = parseFloat(state.marginSummary.accountValue);
    return [
      {
        protocol: Protocol.HYPERLIQUID,
        asset: 'USDC',
        amount: accountValue,
        usdValue: accountValue,
      },
    ];
  }

  async getFundingHistory(_address: Address, _since: number): Promise<FundingPayment[]> {
    // Full funding history requires paginated /info userFunding — deferred to Week 1 full build
    return [];
  }

  async getFills(_address: Address, _since: number): Promise<Fill[]> {
    // Full fill history — deferred to Week 1 full build
    return [];
  }

  async getMarkPrice(symbol: string): Promise<number> {
    const coin = symbol.replace('-PERP', '');
    const [meta, ctxs] = await getMetaAndAssetCtxs();
    const idx = meta.universe.findIndex((a) => a.name === coin);
    if (idx === -1) throw new Error(`Unknown symbol: ${symbol}`);
    const ctx = ctxs[idx];
    if (!ctx) throw new Error(`No context for symbol: ${symbol}`);
    return parseFloat(ctx.markPx);
  }

  subscribePositions(address: Address, onUpdate: (positions: Position[]) => void): Unsubscribe {
    // Polling fallback — WS subscription added in Week 1 full build
    const INTERVAL_MS = 5000;
    let running = true;

    const poll = async () => {
      while (running) {
        try {
          const positions = await this.getPositions(address);
          onUpdate(positions);
        } catch {
          // swallow; aggregator handles health tracking
        }
        await new Promise((r) => setTimeout(r, INTERVAL_MS));
      }
    };

    void poll();
    return () => { running = false; };
  }
}

export const hyperliquidAdapter = new HyperliquidAdapter();
