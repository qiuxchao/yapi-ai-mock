import { copy, readFileSync, writeFileSync } from 'fs-extra';
import path from 'path';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: [
		'src/index',
		'src/cli',
		{
			builder: 'mkdist',
			input: 'src/chat/typechat',
			outDir: 'lib/typechat',
			format: 'cjs',
		},
	],
	outDir: 'lib',
	declaration: true,
	clean: true,
	rollup: {
		inlineDependencies: true,
		emitCJS: true,
		cjsBridge: true,
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
			const cliCJSContent = readFileSync(path.resolve(__dirname, 'lib/cli.cjs'), 'utf8');
			writeFileSync(
				path.resolve(__dirname, 'lib/cli.cjs'),
				cliCJSContent.replace(/require\('typechat'\)/, `require('./typechat')`)
			);
		},
	},
});
