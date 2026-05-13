import { getAdaptersForAddress } from '@perpdeck/adapters-base';
import {
  calcTotalUnrealizedPnl,
  calcTotalFundingPaid,
  calcNetDelta,
  calcTotalNotional,
  type PortfolioSummary,
  type AdapterStatus,
  Protocol,
} from '@perpdeck/shared';

export async function aggregatePortfolio(address: string): Promise<PortfolioSummary> {
  const adapters = getAdaptersForAddress(address);
  const adapterHealth: Record<string, AdapterStatus> = {};

  const results = await Promise.allSettled(
    adapters.map(async (adapter) => {
      const [positions, balances] = await Promise.all([
        adapter.getPositions(address),
        adapter.getBalances(address),
      ]);
      adapterHealth[adapter.protocol] = { healthy: true, lastSuccessAt: Date.now(), error: null };
      return { positions, balances };
    }),
  );

  const allPositions = [];
  const allBalances = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const adapter = adapters[i];
    if (!adapter) continue;

    if (result?.status === 'fulfilled') {
      allPositions.push(...result.value.positions);
      allBalances.push(...result.value.balances);
    } else {
      const err = result?.status === 'rejected' ? (result.reason as Error).message : 'unknown';
      adapterHealth[adapter.protocol] = { healthy: false, lastSuccessAt: null, error: err };
    }
  }

  // Fill in healthy status for any protocol not queried
  for (const protocol of Object.values(Protocol)) {
    if (!(protocol in adapterHealth)) {
      adapterHealth[protocol] = { healthy: true, lastSuccessAt: null, error: null };
    }
  }

  return {
    totalNotional: calcTotalNotional(allPositions),
    totalUnrealizedPnl: calcTotalUnrealizedPnl(allPositions),
    totalFundingPaid: calcTotalFundingPaid(allPositions),
    netDelta: calcNetDelta(allPositions),
    positions: allPositions,
    balances: allBalances,
    updatedAt: Date.now(),
    adapterHealth: adapterHealth as Record<Protocol, AdapterStatus>,
  };
}
