import path from 'path';
import fs from 'fs-extra';
import consola from 'consola';
import TSNode from 'ts-node';
import ora from 'ora';
import yargs from 'yargs';
import { memoize, castArray, uniq, isEmpty, omit, wait } from 'vtils';
import nodeFetch from 'node-fetch';

function throwError(...msg) {
  throw new Error(msg.join(""));
}
async function httpGet(url, query) {
  const _url = new URL(url);
  if (query) {
    Object.keys(query).forEach((key) => {
      _url.searchParams.set(key, query[key]);
    });
  }
  url = _url.toString();
  const res = await nodeFetch(url, {
    method: "GET"
  });
  return res.json();
}

class Generator {
  constructor(config, options = { cwd: process.cwd() }) {
    this.options = options;
    /** 配置 */
    this.config = [];
    this.fetchExport = memoize(
      async ({ serverUrl, token }) => {
        const projectInfo = await this.fetchProject({ serverUrl, token });
        const categoryList = await this.fetchApi(`${serverUrl}/api/plugin/export`, {
          type: "json",
          status: "all",
          isWiki: "false",
          token
        });
        return categoryList.map((cat) => {
          const projectId = cat.list?.[0]?.project_id || 0;
          const catId = cat.list?.[0]?.catid || 0;
          cat._url = `${serverUrl}/project/${projectId}/interface/api/cat_${catId}`;
          cat.list = (cat.list || []).map((item) => {
            const interfaceId = item._id;
            item._url = `${serverUrl}/project/${projectId}/interface/api/${interfaceId}`;
            item.path = `${projectInfo.basepath}${item.path}`;
            return item;
          });
          return cat;
        });
      },
      ({ serverUrl, token }) => `${serverUrl}|${token}`
    );
    this.fetchProject = memoize(
      async ({ serverUrl, token }) => {
        const projectInfo = await this.fetchApi(`${serverUrl}/api/project/get`, {
          token
        });
        const basePath = `/${projectInfo.basepath || "/"}`.replace(/\/+$/, "").replace(/^\/+/, "/");
        projectInfo.basepath = basePath;
        projectInfo._url = `${serverUrl}/project/${projectInfo._id}/interface/api`;
        return projectInfo;
      },
      ({ serverUrl, token }) => `${serverUrl}|${token}`
    );
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
    const outputFileList = /* @__PURE__ */ Object.create(null);
    await Promise.all(
      this.config.map(async (serverConfig, serverIndex) => {
        const projects = serverConfig.projects.reduce((projects2, project) => {
          projects2.push(
            ...castArray(project.token).map((token) => ({
              ...project,
              token
            }))
          );
          return projects2;
        }, []);
        return Promise.all(
          projects.map(async (projectConfig, projectIndex) => {
            const projectInfo = await this.fetchProjectInfo({
              ...serverConfig,
              ...projectConfig
            });
            await Promise.all(
              projectConfig.categories.map(async (categoryConfig, categoryIndex) => {
                let categoryIds = castArray(categoryConfig.id);
                if (categoryIds.includes(0)) {
                  categoryIds.push(...projectInfo.cats.map((cat) => cat._id));
                }
                categoryIds = uniq(categoryIds);
                const excludedCategoryIds = categoryIds.filter((id) => id < 0).map(Math.abs);
                categoryIds = categoryIds.filter((id) => !excludedCategoryIds.includes(Math.abs(id)));
                categoryIds = categoryIds.filter((id) => !!projectInfo.cats.find((cat) => cat._id === id));
                categoryIds = categoryIds.sort();
                (await Promise.all(
                  categoryIds.map(async (id, categoryIndex2) => {
                    categoryConfig = {
                      ...categoryConfig,
                      id
                    };
                    const syntheticalConfig = {
                      ...serverConfig,
                      ...projectConfig,
                      ...categoryConfig
                    };
                    syntheticalConfig.target = syntheticalConfig.target || "typescript";
                    let interfaceList = await this.fetchInterfaceList(syntheticalConfig);
                    categoryIndex2 === 0 && console.log(syntheticalConfig, interfaceList);
                    return interfaceList;
                  })
                )).flat();
              })
            );
          })
        );
      })
    );
    return outputFileList;
  }
  /** 写入文件 */
  async write(outputFileList) {
  }
  async fetchApi(url, query) {
    const res = await httpGet(url, query);
    if (res && res.errcode) {
      throwError(res.errmsg);
    }
    return res.data || res;
  }
  /** 获取项目信息 */
  async fetchProjectInfo(syntheticalConfig) {
    const projectInfo = await this.fetchProject(syntheticalConfig);
    const projectCats = await this.fetchApi(`${syntheticalConfig.serverUrl}/api/interface/getCatMenu`, {
      token: syntheticalConfig.token,
      project_id: projectInfo._id
    });
    return {
      ...projectInfo,
      cats: projectCats
    };
  }
  /** 获取分类的接口列表 */
  async fetchInterfaceList({ serverUrl, token, id }) {
    const category = (await this.fetchExport({ serverUrl, token }) || []).find(
      (cat) => !isEmpty(cat) && !isEmpty(cat.list) && cat.list[0].catid === id
    );
    if (category) {
      category.list.forEach((interfaceInfo) => {
        interfaceInfo._category = omit(category, ["list"]);
      });
    }
    return category ? category.list : [];
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
    await config.hooks?.success?.();
  } catch (err) {
    spinner?.stop();
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
