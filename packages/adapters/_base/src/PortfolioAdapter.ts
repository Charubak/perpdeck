import type {
  Protocol,
  Chain,
  Address,
  Position,
  Balance,
  FundingPayment,
  Fill,
} from '@perpdeck/shared';

export type Unsubscribe = () => void;

export interface PortfolioAdapter {
  readonly protocol: Protocol;
  readonly chain: Chain;
  readonly version: string;  // adapter's target API version string for staleness detection

  /** Returns true only if this adapter can handle the given address format. */
  supports(address: Address): boolean;

  getPositions(address: Address): Promise<Position[]>;
  getBalances(address: Address): Promise<Balance[]>;
  getFundingHistory(address: Address, since: number): Promise<FundingPayment[]>;
  getFills(address: Address, since: number): Promise<Fill[]>;
  getMarkPrice(symbol: string): Promise<number>;

  /** Optional real-time subscription. Returns unsubscribe fn. */
  subscribePositions?(address: Address, onUpdate: (positions: Position[]) => void): Unsubscribe;
}
