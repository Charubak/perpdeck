import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import ws from '@fastify/websocket';
import { portfolioRoutes } from './routes/portfolio.js';
import { wsRoutes } from './ws/index.js';

// Register adapters
import { registerAdapter } from '@perpdeck/adapters-base';
import { hyperliquidAdapter } from '@perpdeck/adapter-hyperliquid';
import { lighterAdapter } from '@perpdeck/adapter-lighter';
import { extendedAdapter } from '@perpdeck/adapter-extended';
import { dydxAdapter } from '@perpdeck/adapter-dydx';

registerAdapter(hyperliquidAdapter);
registerAdapter(lighterAdapter);
registerAdapter(extendedAdapter);
registerAdapter(dydxAdapter);

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';

const app = Fastify({ logger: { level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug' } });

await app.register(cors, { origin: true });
await app.register(rateLimit, { max: 60, timeWindow: '1 minute' });
await app.register(ws);

app.get('/health', async () => {
  return { status: 'ok', ts: Date.now() };
});

await app.register(portfolioRoutes, { prefix: '/api' });
await app.register(wsRoutes);

try {
  await app.listen({ port: PORT, host: HOST });
  console.info(`perpdeck api running on ${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
