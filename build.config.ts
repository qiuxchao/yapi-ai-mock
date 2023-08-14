import { copy } from 'fs-extra';
import path from 'path';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: ['src/index', 'src/cli'],
	outDir: 'lib',
	declaration: true,
	clean: true,
	rollup: {
		inlineDependencies: true,
		emitCJS: true,
		esbuild: {
			// minify: true,
		},
		alias: {
			entries: {
				'@': path.resolve(__dirname, 'src'),
			},
		},
	},
	failOnWarn: false,
	hooks: {
		'build:done': async (context) => {
			copy(path.resolve(__dirname, 'src/chat/mockSchema.ts'), path.resolve(__dirname, 'lib/mockSchema.ts'));
		},
	},
});
