import { pgTable, text, real, boolean, bigint, timestamp } from 'drizzle-orm/pg-core';

/** Live position snapshots — hypertable candidate for TimescaleDB at v2 */
export const positionSnapshots = pgTable('position_snapshots', {
  id: text('id').notNull(),
  address: text('address').notNull(),
  protocol: text('protocol').notNull(),
  symbol: text('symbol').notNull(),
  side: text('side', { enum: ['long', 'short'] }).notNull(),
  size: real('size').notNull(),
  notional: real('notional').notNull(),
  entryPrice: real('entry_price').notNull(),
  markPrice: real('mark_price').notNull(),
  unrealizedPnl: real('unrealized_pnl').notNull(),
  fundingPaid: real('funding_paid').notNull(),
  liquidationPrice: real('liquidation_price'),
  snapshotAt: timestamp('snapshot_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Tracked addresses (for watchlist / recurring polling) */
export const trackedAddresses = pgTable('tracked_addresses', {
  address: text('address').primaryKey(),
  label: text('label'),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  lastPolledAt: timestamp('last_polled_at', { withTimezone: true }),
  isPrivate: boolean('is_private').notNull().default(false),
});

/** Funding payment history */
export const fundingHistory = pgTable('funding_history', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  address: text('address').notNull(),
  protocol: text('protocol').notNull(),
  symbol: text('symbol').notNull(),
  amount: real('amount').notNull(),
  rate: real('rate').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull(),
});
