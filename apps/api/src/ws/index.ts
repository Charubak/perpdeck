import type { FastifyInstance } from 'fastify';
import { getAdaptersForAddress } from '@perpdeck/adapters-base';
import type { Position } from '@perpdeck/shared';

type WsMessage =
  | { type: 'subscribe'; address: string }
  | { type: 'unsubscribe'; address: string };

type WsUpdate = {
  type: 'positions';
  address: string;
  positions: Position[];
  updatedAt: number;
};

export async function wsRoutes(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (socket) => {
    const unsubs = new Map<string, Array<() => void>>();

    socket.on('message', (raw) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(raw.toString()) as WsMessage;
      } catch {
        return;
      }

      if (msg.type === 'subscribe') {
        const { address } = msg;
        if (unsubs.has(address)) return; // already subscribed

        const adapters = getAdaptersForAddress(address);
        const subs: Array<() => void> = [];

        for (const adapter of adapters) {
          if (!adapter.subscribePositions) continue;
          const unsub = adapter.subscribePositions(address, (positions) => {
            const update: WsUpdate = { type: 'positions', address, positions, updatedAt: Date.now() };
            if (socket.readyState === 1) {
              socket.send(JSON.stringify(update));
            }
          });
          subs.push(unsub);
        }

        unsubs.set(address, subs);
      }

      if (msg.type === 'unsubscribe') {
        const subs = unsubs.get(msg.address);
        if (subs) {
          subs.forEach((fn) => fn());
          unsubs.delete(msg.address);
        }
      }
    });

    socket.on('close', () => {
      for (const subs of unsubs.values()) {
        subs.forEach((fn) => fn());
      }
      unsubs.clear();
    });
  });
}
