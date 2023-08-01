import path from 'path';
import fs from 'fs-extra';
import consola from 'consola';
import TSNode from 'ts-node';
import { ConfigWithHooks } from './types';
import ora from 'ora';
import yargs from 'yargs';
import { wait } from 'vtils';
import { Generator } from './Generator';

TSNode.register({
	// 不加载本地的 tsconfig.json
	skipProject: true,
	// 仅转译，不做类型检查
	transpileOnly: true,
	// 自定义编译选项
	compilerOptions: {
		strict: false,
		target: 'es2017',
		module: 'commonjs',
		moduleResolution: 'node',
		declaration: false,
		removeComments: false,
		esModuleInterop: true,
		allowSyntheticDefaultImports: true,
		importHelpers: false,
		// 转换 js，支持在 ytm.config.js 里使用最新语法
		allowJs: true,
		lib: ['es2017'],
	},
});

export default async function ytm(config: ConfigWithHooks) {
	const generator = new Generator(config);
	let spinner = ora('正在获取数据并生成代码...').start();
	try {
		const delayNotice = wait(5000);
		delayNotice.then(() => {
			spinner!.text = `正在获取数据并生成代码... (若长时间处于此状态，请检查是否有接口定义的数据过大导致拉取或解析缓慢)`;
		});
		await generator.prepare();
		delayNotice.cancel();

		const output = await generator.generate();
		spinner.stop();
		consola.success('获取数据并生成代码完毕');

		await generator.write(output);
		consola.success('写入文件完毕');
		await config!.hooks?.success?.();
	} catch (err) {
		spinner?.stop();
		await config?.hooks?.fail?.();
		consola.error(err);
	}
	await config?.hooks?.complete?.();
}

export async function run(
	cmd: string | undefined,
	options?: {
		configFile?: string;
	}
) {
	let useCustomConfigFile = false;
	let cwd!: string;
	let configTSFile!: string;
	let configJSFile!: string;
	let configFile!: string;
	let configFileExist!: boolean;

	if (!options?.configFile) {
		cwd = process.cwd();
		configTSFile = path.join(cwd, 'ytm.config.ts');
		configJSFile = path.join(cwd, 'ytm.config.js');
		const configTSFileExist = await fs.pathExists(configTSFile);
		const configJSFileExist = !configTSFileExist && (await fs.pathExists(configJSFile));
		configFileExist = configTSFileExist || configJSFileExist;
		configFile = configTSFileExist ? configTSFile : configJSFile;
	} else {
		useCustomConfigFile = true;
		configFile = options.configFile;
		cwd = path.dirname(configFile);
		configFileExist = await fs.pathExists(configFile);
	}

	if (!configFileExist) {
		return consola.error(`找不到配置文件: ${useCustomConfigFile ? configFile : `${configTSFile} 或 ${configJSFile}`}`);
	}
	consola.success(`找到配置文件: ${configFile}`);
	const config: ConfigWithHooks = require(configFile).default;
	console.log(config);
	await ytm(config);
}

if (require.main === module) {
	const argv = yargs(process.argv).alias('c', 'config').argv;
	// 指定配置文件运行：ytm -c|-config=配置文件路径
	run(argv._[2] as any, {
		configFile: argv.config ? path.resolve(process.cwd(), argv.config as string) : undefined,
	});
}
