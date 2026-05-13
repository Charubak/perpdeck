export enum Protocol {
  HYPERLIQUID = 'hyperliquid',
  DYDX = 'dydx',
  GMX = 'gmx',
  DRIFT = 'drift',
  JUPITER = 'jupiter',
  PACIFICA = 'pacifica',
  PARADEX = 'paradex',
  EXTENDED = 'extended',
  LIGHTER = 'lighter',
  ASTER = 'aster',
  AVANTIS = 'avantis',
  HIBACHI = 'hibachi',
  VARIATIONAL = 'variational',
  OMNI = 'omni',
}

export enum Chain {
  HYPERLIQUID_L1 = 'hyperliquid_l1',
  ETHEREUM = 'ethereum',
  ARBITRUM = 'arbitrum',
  AVALANCHE = 'avalanche',
  BASE = 'base',
  BNB = 'bnb',
  SOLANA = 'solana',
  STARKNET = 'starknet',
  ZKSYNC = 'zksync',
  DYDX_CHAIN = 'dydx_chain',
}

export const PROTOCOL_META: Record<
  Protocol,
  { name: string; chain: Chain; color: string }
> = {
  [Protocol.HYPERLIQUID]: { name: 'Hyperliquid', chain: Chain.HYPERLIQUID_L1, color: '#00d4a0' },
  [Protocol.DYDX]: { name: 'dYdX', chain: Chain.DYDX_CHAIN, color: '#6966ff' },
  [Protocol.GMX]: { name: 'GMX', chain: Chain.ARBITRUM, color: '#2d42fc' },
  [Protocol.DRIFT]: { name: 'Drift', chain: Chain.SOLANA, color: '#8752f3' },
  [Protocol.JUPITER]: { name: 'Jupiter Perps', chain: Chain.SOLANA, color: '#e8780a' },
  [Protocol.PACIFICA]: { name: 'Pacifica', chain: Chain.SOLANA, color: '#22c55e' },
  [Protocol.PARADEX]: { name: 'Paradex', chain: Chain.STARKNET, color: '#f97316' },
  [Protocol.EXTENDED]: { name: 'Extended', chain: Chain.STARKNET, color: '#a855f7' },
  [Protocol.LIGHTER]: { name: 'Lighter', chain: Chain.ZKSYNC, color: '#3b82f6' },
  [Protocol.ASTER]: { name: 'Aster', chain: Chain.BNB, color: '#eab308' },
  [Protocol.AVANTIS]: { name: 'Avantis', chain: Chain.BASE, color: '#0052ff' },
  [Protocol.HIBACHI]: { name: 'Hibachi', chain: Chain.ETHEREUM, color: '#ef4444' },
  [Protocol.VARIATIONAL]: { name: 'Variational', chain: Chain.ETHEREUM, color: '#ec4899' },
  [Protocol.OMNI]: { name: 'Omni', chain: Chain.ETHEREUM, color: '#14b8a6' },
};
