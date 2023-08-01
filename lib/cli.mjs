import path from 'path';
import fs from 'fs-extra';
import consola from 'consola';
import TSNode from 'ts-node';
import ora from 'ora';
import yargs from 'yargs';
import { castArray, wait } from 'vtils';

class Generator {
  constructor(config, options = { cwd: process.cwd() }) {
    this.options = options;
    /** 配置 */
    this.config = [];
    this.disposes = [];
    this.config = castArray(config);
  }
  /** 前置方法，统一配置项 */
  async prepare() {
    this.config = await Promise.all(
      // config 可能是对象或数组，统一为数组
      this.config.map(async (item) => {
        if (item.serverUrl) {
          item.serverUrl = item.serverUrl.replace(/\/+$/, "");
        }
        return item;
      })
    );
  }
  /** 生成 mock 配置，返回 */
  async generate() {
  }
  async write(outputFileList) {
  }
  async destroy() {
    return Promise.all(this.disposes.map(async (dispose) => dispose()));
  }
}

TSNode.register({
  // 不加载本地的 tsconfig.json
  skipProject: true,
  // 仅转译，不做类型检查
  transpileOnly: true,
  // 自定义编译选项
  compilerOptions: {
    strict: false,
    target: "es2017",
    module: "commonjs",
    moduleResolution: "node",
    declaration: false,
    removeComments: false,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    importHelpers: false,
    // 转换 js，支持在 ytm.config.js 里使用最新语法
    allowJs: true,
    lib: ["es2017"]
  }
});
async function ytm(config) {
  const generator = new Generator(config);
  let spinner = ora("\u6B63\u5728\u83B7\u53D6\u6570\u636E\u5E76\u751F\u6210\u4EE3\u7801...").start();
  try {
    const delayNotice = wait(5e3);
    delayNotice.then(() => {
      spinner.text = `\u6B63\u5728\u83B7\u53D6\u6570\u636E\u5E76\u751F\u6210\u4EE3\u7801... (\u82E5\u957F\u65F6\u95F4\u5904\u4E8E\u6B64\u72B6\u6001\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u6709\u63A5\u53E3\u5B9A\u4E49\u7684\u6570\u636E\u8FC7\u5927\u5BFC\u81F4\u62C9\u53D6\u6216\u89E3\u6790\u7F13\u6162)`;
    });
    await generator.prepare();
    delayNotice.cancel();
    const output = await generator.generate();
    spinner.stop();
    consola.success("\u83B7\u53D6\u6570\u636E\u5E76\u751F\u6210\u4EE3\u7801\u5B8C\u6BD5");
    await generator.write(output);
    consola.success("\u5199\u5165\u6587\u4EF6\u5B8C\u6BD5");
    await generator.destroy();
    await config.hooks?.success?.();
  } catch (err) {
    spinner?.stop();
    await generator?.destroy();
    await config?.hooks?.fail?.();
    consola.error(err);
  }
  await config?.hooks?.complete?.();
}
async function run(cmd, options) {
  let useCustomConfigFile = false;
  let cwd;
  let configTSFile;
  let configJSFile;
  let configFile;
  let configFileExist;
  if (!options?.configFile) {
    cwd = process.cwd();
    configTSFile = path.join(cwd, "ytm.config.ts");
    configJSFile = path.join(cwd, "ytm.config.js");
    const configTSFileExist = await fs.pathExists(configTSFile);
    const configJSFileExist = !configTSFileExist && await fs.pathExists(configJSFile);
    configFileExist = configTSFileExist || configJSFileExist;
    configFile = configTSFileExist ? configTSFile : configJSFile;
  } else {
    useCustomConfigFile = true;
    configFile = options.configFile;
    cwd = path.dirname(configFile);
    configFileExist = await fs.pathExists(configFile);
  }
  if (!configFileExist) {
    return consola.error(`\u627E\u4E0D\u5230\u914D\u7F6E\u6587\u4EF6: ${useCustomConfigFile ? configFile : `${configTSFile} \u6216 ${configJSFile}`}`);
  }
  consola.success(`\u627E\u5230\u914D\u7F6E\u6587\u4EF6: ${configFile}`);
  const config = require(configFile).default;
  console.log(config);
  await ytm(config);
}
if (require.main === module) {
  const argv = yargs(process.argv).alias("c", "config").argv;
  run(argv._[2], {
    configFile: argv.config ? path.resolve(process.cwd(), argv.config) : void 0
  });
}

export { ytm as default, run };
