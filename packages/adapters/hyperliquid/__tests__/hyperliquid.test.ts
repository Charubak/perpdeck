import { describe, it, expect } from 'vitest';
import { HyperliquidAdapter } from '../src/index.js';
import { TEST_ADDRESS } from './fixtures.js';

const adapter = new HyperliquidAdapter();

describe('HyperliquidAdapter', () => {
  it('supports EVM addresses', () => {
    expect(adapter.supports('0x563c175e6f11582f65d6d9e360a9b9a0e1b8ff0c')).toBe(true);
    expect(adapter.supports('dydx1abc')).toBe(false);
    expect(adapter.supports('ABC123solana')).toBe(false);
  });

  it('rejects invalid addresses', () => {
    expect(adapter.supports('not-an-address')).toBe(false);
    expect(adapter.supports('')).toBe(false);
  });

  // Integration test — skipped in CI unless INTEGRATION=true
  it.skipIf(!process.env['INTEGRATION'])('fetches positions for known address', async () => {
    const positions = await adapter.getPositions(TEST_ADDRESS);
    // Snapshot test: validate shape, not values
    for (const pos of positions) {
      expect(pos).toMatchObject({
        id: expect.stringContaining('hyperliquid:'),
        protocol: 'hyperliquid',
        symbol: expect.stringMatching(/-PERP$/),
        side: expect.stringMatching(/^(long|short)$/),
        size: expect.any(Number),
        notional: expect.any(Number),
        entryPrice: expect.any(Number),
        markPrice: expect.any(Number),
        leverage: expect.any(Number),
        unrealizedPnl: expect.any(Number),
        fundingPaid: expect.any(Number),
      });
    }
  }, 10000);
});
