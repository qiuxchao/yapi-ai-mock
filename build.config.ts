import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: ['./src/index'],
	outDir: 'lib',
	declaration: true,
	clean: true,
	rollup: {
		emitCJS: true,
	},
});
