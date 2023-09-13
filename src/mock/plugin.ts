import type { MockServerPluginOptions } from './types';
import { mockServerMiddleware } from './mockMiddleware';
import { type Server } from 'node:http';

/** Vite Mock 插件 */
export function viteMockPlugin(options: MockServerPluginOptions = {}): any {
  return {
    name: 'vite-mock-plugin',
    async configureServer({ middlewares, httpServer }: any) {
      const middleware = await mockServerMiddleware(httpServer, options);
      middlewares.use(middleware);
    },
  };
}

/** Webpack mock 中间件 */
export async function webpackMockMiddleware(
  httpServer: Server | null,
  options: MockServerPluginOptions = {},
) {
  const middleware = await mockServerMiddleware(httpServer, options);
  return middleware;
}
