import type { FastifyInstance } from 'fastify';
import { aggregatePortfolio } from '../aggregator.js';
import { cacheGet, cacheSet, portfolioCacheKey } from '../cache.js';
import type { PortfolioSummary } from '@perpdeck/shared';

export async function portfolioRoutes(app: FastifyInstance) {
  app.get<{ Params: { address: string } }>('/portfolio/:address', async (req, reply) => {
    const { address } = req.params;

    const cacheKey = portfolioCacheKey(address);
    const cached = await cacheGet<PortfolioSummary>(cacheKey);

    if (cached) {
      // Stale-while-revalidate: return cached immediately, refresh async
      void aggregatePortfolio(address).then((fresh) => cacheSet(cacheKey, fresh));
      return reply.send(cached);
    }

    const portfolio = await aggregatePortfolio(address);
    await cacheSet(cacheKey, portfolio);
    return reply.send(portfolio);
  });
}
