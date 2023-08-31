import path from 'path';
import fs from 'fs-extra';
import consola from 'consola';
import { Config } from '@/types';
import ora from 'ora';
import yargs from 'yargs';
import { wait } from 'vtils';
import { Generator } from '@/Generator';
import mockServer from '@/mock/server';
import { loadModule } from '@/utils';
import { CONFIG_TEMP_PATH, ENV_FILE_PATH } from '@/constant';
import dotenv from 'dotenv';
import init from '@/init';

const yam = async (config: Config) => {
  // 注入环境变量
  const { envPath } = config;
  const hasEnvPath = await fs.pathExists(path.resolve(process.cwd(), envPath || ENV_FILE_PATH));
  if (hasEnvPath) {
    dotenv.config({ path: path.resolve(process.cwd(), envPath || ENV_FILE_PATH) });
  }
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
    const total = await generator.resolve();
    delayNotice.cancel();
    spinner1.stop();
    consola.success('接口数据获取并解析完毕');
    if (total > 0) {
      spinner2.start();
      await generator.generate(spinner2);
      spinner2.stop();
      consola.success('代码生成完毕');
    } else {
      consola.success('未发现需要生成的接口');
    }
    await config!.hooks?.success?.();
  } catch (err) {
    spinner1?.stop();
    spinner2?.stop();
    await config?.hooks?.fail?.();
    consola.error(err);
  }
  await config?.hooks?.complete?.();
};

const run = async (options?: { configFile?: string; port?: number }, isServe = false) => {
  let useCustomConfigFile = false;
  let cwd!: string;
  let configTSFile!: string;
  let configJSFile!: string;
  let configFile!: string;
  let configFileExist!: boolean;

  if (!options?.configFile) {
    cwd = process.cwd();
    configTSFile = path.join(cwd, 'yam.config.ts');
    configJSFile = path.join(cwd, 'yam.config.js');
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
  // 读取宿主项目的 package.json
  const packageJson = await fs.readJSON(path.resolve(cwd, 'package.json'));
  const isESM = packageJson.type === 'module';
  const { content: config } = await loadModule<Config>(configFile, CONFIG_TEMP_PATH, isESM);
  if (isServe) {
    await mockServer({
      ...(config.mockServer ?? {}),
      port: options?.port ?? config.mockServer?.port,
    });
    return;
  }
  await yam(config);
};

if (require.main === module) {
  const argv = yargs(process.argv)
    .usage('使用：npx yam [选项]')
    .alias('h', ['help'])
    .alias('c', 'config')
    .alias('t', 'target')
    .alias('p', 'port')
    .alias('version', 'v')
    .example('$ npx yam', '生成 mock 文件')
    .example('$ npx yam -c=配置文件路径', '指定配置文件并生成 mock 文件')
    .example('$ npx yam serve', '启动 mock 服务器，默认端口号为 3000')
    .example('$ npx yam serve -p=端口号', '指定端口启动 mock 服务器')
    .example('$ npx yam init', '初始化配置文件，默认配置文件类型为 ts')
    .example('$ npx yam init -t=ts|js', '指定文件类型初始化配置文件').argv;
  // 指定配置文件运行：yam -c|-config=配置文件路径
  if (argv._[2] === 'init') {
    init(process.cwd(), ['ts', 'js'].includes(String(argv.target)) ? (argv.target as 'ts' | 'js') : 'ts');
  } else {
    run(
      {
        configFile: argv.config ? path.resolve(process.cwd(), argv.config as string) : undefined,
        port: argv.port ? Number(argv.port) : undefined,
      },
      argv._[2] === 'serve'
    );
  }
}

export default yam;
