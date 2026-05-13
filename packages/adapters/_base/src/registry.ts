import type { PortfolioAdapter } from './PortfolioAdapter.js';
import type { Protocol } from '@perpdeck/shared';

const adapters: Map<Protocol, PortfolioAdapter> = new Map();

export function registerAdapter(adapter: PortfolioAdapter): void {
  adapters.set(adapter.protocol, adapter);
}

export function getAdapter(protocol: Protocol): PortfolioAdapter | undefined {
  return adapters.get(protocol);
}

export function getAllAdapters(): PortfolioAdapter[] {
  return [...adapters.values()];
}

export function getAdaptersForAddress(address: string): PortfolioAdapter[] {
  return getAllAdapters().filter((a) => a.supports(address));
}
