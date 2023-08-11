import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	outDir: 'lib',
	declaration: true,
	clean: true,
	rollup: {
		emitCJS: true,
	},
});
