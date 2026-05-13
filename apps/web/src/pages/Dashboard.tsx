import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { PortfolioSummary, Position } from '@perpdeck/shared';
import { PROTOCOL_META } from '@perpdeck/shared';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function PnlCell({ value }: { value: number }) {
  const cls = value >= 0 ? 'pnl-pos' : 'pnl-neg';
  const sign = value >= 0 ? '+' : '';
  return <span className={`font-num ${cls}`}>{sign}${fmt(value)}</span>;
}

function PositionRow({ pos }: { pos: Position }) {
  const meta = PROTOCOL_META[pos.protocol];
  const pct = ((pos.unrealizedPnl / pos.notional) * 100);
  const pctStr = (pct >= 0 ? '+' : '') + fmt(pct) + '%';

  return (
    <tr className="border-b border-border hover:bg-surface/60 transition-colors text-sm">
      <td className="px-3 py-2">
        <span
          className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: meta?.color + '22', color: meta?.color }}
        >
          {meta?.name ?? pos.protocol}
        </span>
      </td>
      <td className="px-3 py-2 font-mono font-medium">{pos.symbol}</td>
      <td className="px-3 py-2">
        <span className={pos.side === 'long' ? 'pnl-pos' : 'pnl-neg'}>
          {pos.side.toUpperCase()}
        </span>
      </td>
      <td className="px-3 py-2 font-num text-right">{fmt(pos.size, 4)}</td>
      <td className="px-3 py-2 font-num text-right">${fmt(pos.notional)}</td>
      <td className="px-3 py-2 font-num text-right">${fmt(pos.entryPrice)}</td>
      <td className="px-3 py-2 font-num text-right">${fmt(pos.markPrice)}</td>
      <td className="px-3 py-2 font-num text-right">
        <PnlCell value={pos.unrealizedPnl} />
        <span className="text-muted text-xs ml-1">({pctStr})</span>
      </td>
      <td className="px-3 py-2 font-num text-right text-muted">
        {pos.liquidationPrice !== null ? '$' + fmt(pos.liquidationPrice) : '—'}
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const { address } = useParams<{ address: string }>();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/portfolio/${address}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json() as Promise<PortfolioSummary>;
      })
      .then((data) => {
        setPortfolio(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [address]);

  return (
    <div className="min-h-screen px-4 py-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <Link to="/" className="text-accent font-medium text-sm hover:underline">perpdeck</Link>
        <span className="font-mono text-xs text-muted truncate max-w-xs">{address}</span>
      </header>

      {loading && (
        <div className="text-muted text-sm animate-pulse">Loading positions...</div>
      )}

      {error && (
        <div className="text-pnl-neg text-sm">Failed to load: {error}</div>
      )}

      {portfolio && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Notional', value: '$' + fmt(portfolio.totalNotional) },
              { label: 'Unrealized PnL', value: <PnlCell value={portfolio.totalUnrealizedPnl} /> },
              { label: 'Funding Paid', value: <PnlCell value={portfolio.totalFundingPaid} /> },
              { label: 'Net Delta', value: <PnlCell value={portfolio.netDelta} /> },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface border border-border rounded p-4">
                <div className="text-xs text-muted mb-1">{label}</div>
                <div className="text-lg font-medium font-num">{value}</div>
              </div>
            ))}
          </div>

          {portfolio.positions.length === 0 ? (
            <div className="text-muted text-sm">No open positions found across supported protocols.</div>
          ) : (
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted text-xs uppercase tracking-wider">
                    {['Protocol', 'Symbol', 'Side', 'Size', 'Notional', 'Entry', 'Mark', 'Unr. PnL', 'Liq. Price'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolio.positions.map((pos) => (
                    <PositionRow key={pos.id} pos={pos} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-xs text-muted">
            Last updated {new Date(portfolio.updatedAt).toLocaleTimeString()} · Realized PnL coming in v2
          </div>
        </>
      )}
    </div>
  );
}
