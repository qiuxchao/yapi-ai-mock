import path from 'path';
import fs from 'fs-extra';
import consola from 'consola';
import TSNode from 'ts-node';
import { ConfigWithHooks } from '@/types';
import ora from 'ora';
import yargs from 'yargs';
import { wait } from 'vtils';
import { Generator } from '@/Generator';

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
		// 转换 js，支持在 ygm.config.js 里使用最新语法
		allowJs: true,
		lib: ['es2017'],
	},
});

const ygm = async (config: ConfigWithHooks) => {
	const generator = new Generator(config);
	const spinner1 = ora('正在读取并解析配置文件...').start();
	try {
		await generator.prepare();
		spinner1.text = '正在获取并解析接口数据...';
		const delayNotice = wait(5000);
		delayNotice.then(() => {
			spinner1!.text = `正在获取并解析接口数据... (若长时间处于此状态，请检查是否有接口定义的数据过大导致拉取或解析缓慢)`;
		});
		await generator.resolve();
		delayNotice.cancel();
		spinner1.stop();
		consola.success('接口数据获取并解析完毕');
		const spinner2 = ora('正在生成代码并写入文件...').start();
		await generator.generate(spinner2);
		spinner2.stop();
		consola.success('全部文件写入完毕');
		await config!.hooks?.success?.();
	} catch (err) {
		spinner1?.stop();
		await config?.hooks?.fail?.();
		consola.error(err);
	}
	await config?.hooks?.complete?.();
};

const run = async (
	cmd: string | undefined,
	options?: {
		configFile?: string;
	}
) => {
	let useCustomConfigFile = false;
	let cwd!: string;
	let configTSFile!: string;
	let configJSFile!: string;
	let configFile!: string;
	let configFileExist!: boolean;

	if (!options?.configFile) {
		cwd = process.cwd();
		configTSFile = path.join(cwd, 'ygm.config.ts');
		configJSFile = path.join(cwd, 'ygm.config.js');
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
	await ygm(config);
};

if (require.main === module) {
	const argv = yargs(process.argv).alias('c', 'config').argv;
	// 指定配置文件运行：ygm -c|-config=配置文件路径
	run(argv._[2] as any, {
		configFile: argv.config ? path.resolve(process.cwd(), argv.config as string) : undefined,
	});
}

export default ygm;
