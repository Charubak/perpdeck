import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const EXAMPLE_ADDRESSES = [
  { label: 'Top HL trader', address: '0x563c175e6f11582f65d6d9e360a9b9a0e1b8ff0c' },
];

export default function Landing() {
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const addr = input.trim();
    if (addr) navigate(`/p/${addr}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">perpdeck</h1>
          <p className="text-muted text-sm">
            All your perp positions — Hyperliquid, dYdX, GMX, Drift, and more — in one view.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a wallet address (0x... or sol... or dydx1...)"
            className="flex-1 bg-surface border border-border rounded px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-accent font-mono"
            autoFocus
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-accent text-bg font-medium text-sm px-4 py-2 rounded disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            View
          </button>
        </form>

        <div className="space-y-1">
          <p className="text-xs text-muted uppercase tracking-wider">Examples</p>
          {EXAMPLE_ADDRESSES.map(({ label, address }) => (
            <button
              key={address}
              onClick={() => navigate(`/p/${address}`)}
              className="block text-xs text-accent font-mono hover:underline"
            >
              {label} — {address}
            </button>
          ))}
        </div>

        <footer className="text-xs text-muted border-t border-border pt-4">
          Read-only. No signing, no custody. Public on-chain data only.
        </footer>
      </div>
    </main>
  );
}
