import { Plugin } from 'vite';
import type { MockServerPluginOptions } from './types';
import { mockServerMiddleware } from './mockMiddleware';
import { type Server } from 'node:http';

export function viteMockPlugin(
	options: MockServerPluginOptions = { include: ['mock/**/*.*'], prefix: '/mock' },
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

export async function webpackMockMiddleware(
	httpServer: Server | null,
	options: MockServerPluginOptions = { include: ['mock/**/*.*'], prefix: '/mock' },
) {
	const middleware = await mockServerMiddleware(
		httpServer,
		options as Required<MockServerPluginOptions>,
	);
	return middleware;
}
