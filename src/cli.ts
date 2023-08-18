import path from 'path';
import fs from 'fs-extra';
import consola from 'consola';
import { ConfigWithHooks, ServerConfig } from '@/types';
import ora from 'ora';
import yargs from 'yargs';
import { wait } from 'vtils';
import { Generator } from '@/Generator';
import mockServer from '@/mock/server';
import { loadModule } from '@/utils';
import { CONFIG_TEMP_PATH } from './constant';

const ygm = async (config: ConfigWithHooks) => {
	const generator = new Generator(config);
	const spinner1 = ora('正在读取并解析配置文件...').start();
	const spinner2 = ora('正在生成代码并写入文件...');
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
		spinner2.start();
		await generator.generate(spinner2);
		spinner2.stop();
		consola.success('所有任务执行完毕');
		await config!.hooks?.success?.();
	} catch (err) {
		spinner1?.stop();
		spinner2?.stop();
		await config?.hooks?.fail?.();
		consola.error(err);
	}
	await config?.hooks?.complete?.();
};

const run = async (options?: { configFile?: string }, isServe = false) => {
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
		return consola.error(
			`找不到配置文件: ${useCustomConfigFile ? configFile : `${configTSFile} 或 ${configJSFile}`}`,
		);
	}
	consola.success(`找到配置文件: ${configFile}`);
	const { content: config } = await loadModule<ConfigWithHooks>(configFile, CONFIG_TEMP_PATH);
	if (isServe) {
		await mockServer((config as ServerConfig)?.mockServer);
		return;
	}
	await ygm(config);
};

if (require.main === module) {
	const argv = yargs(process.argv)
		.usage('使用：npx ygm [选项]')
		.alias('h', ['help'])
		.alias('c', 'config')
		.alias('version', 'v')
		.example('$ npx ygm', '生成 mock 代码')
		.example('$ npx ygm -c=配置文件路径', '指定配置文件并生成 mock 代码')
		.example('$ npx ygm serve', '启动 mock 服务器').argv;
	// 指定配置文件运行：ygm -c|-config=配置文件路径
	run(
		{
			configFile: argv.config ? path.resolve(process.cwd(), argv.config as string) : undefined,
		},
		argv?._?.includes('serve') ?? false,
	);
}

export default ygm;
