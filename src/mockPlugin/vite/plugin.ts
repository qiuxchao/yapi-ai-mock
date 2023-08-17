import { Plugin } from 'vite';
import type { MockServerPluginOptions } from './types';
import { mockServerMiddleware } from './mockMiddleware';

export function mockDevServerPlugin(
	options: MockServerPluginOptions = { include: ['mock/**/*.*'], prefix: '/mock' },
): Plugin {
	return {
		name: 'vite-plugin-mock',
		async configureServer({ middlewares, config, httpServer }) {
			const middleware = await mockServerMiddleware(
				httpServer,
				config,
				options as Required<MockServerPluginOptions>,
			);
			middlewares.use(middleware);
		},
	};
}
