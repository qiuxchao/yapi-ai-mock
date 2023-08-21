import { Plugin } from 'vite';
import type { MockServerPluginOptions } from './types';
import { mockServerMiddleware } from './mockMiddleware';
import { type Server } from 'node:http';
import { INCLUDE, PREFIX } from '../constant';

/** Vite Mock 插件 */
export function viteMockPlugin(
	options: MockServerPluginOptions = { include: INCLUDE, prefix: PREFIX },
): Plugin {
	return {
		name: 'vite-mock-plugin',
		async configureServer({ middlewares, httpServer }) {
			const middleware = await mockServerMiddleware(
				httpServer,
				options as Required<MockServerPluginOptions>,
			);
			middlewares.use(middleware);
		},
	};
}

/** Webpack mock 中间件 */
export async function webpackMockMiddleware(
	httpServer: Server | null,
	options: MockServerPluginOptions = { include: INCLUDE, prefix: PREFIX },
) {
	const middleware = await mockServerMiddleware(
		httpServer,
		options as Required<MockServerPluginOptions>,
	);
	return middleware;
}
