'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const path = require('path');
const fs = require('fs-extra');
const consola = require('consola');
const TSNode = require('ts-node');
const ora = require('ora');
const yargs = require('yargs');
const vtils = require('vtils');
const changeCase = require('change-case');
const nodeFetch = require('node-fetch');
const dayjs = require('dayjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

function _interopNamespaceCompat(e) {
	if (e && typeof e === 'object' && 'default' in e) return e;
	const n = Object.create(null);
	if (e) {
		for (const k in e) {
			n[k] = e[k];
		}
	}
	n.default = e;
	return n;
}

const path__default = /*#__PURE__*/_interopDefaultCompat(path);
const fs__default = /*#__PURE__*/_interopDefaultCompat(fs);
const consola__default = /*#__PURE__*/_interopDefaultCompat(consola);
const TSNode__default = /*#__PURE__*/_interopDefaultCompat(TSNode);
const ora__default = /*#__PURE__*/_interopDefaultCompat(ora);
const yargs__default = /*#__PURE__*/_interopDefaultCompat(yargs);
const changeCase__namespace = /*#__PURE__*/_interopNamespaceCompat(changeCase);
const nodeFetch__default = /*#__PURE__*/_interopDefaultCompat(nodeFetch);
const dayjs__default = /*#__PURE__*/_interopDefaultCompat(dayjs);

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
  const res = await nodeFetch__default(url, {
    method: "GET"
  });
  return res.json();
}

class Generator {
  constructor(config, options = { cwd: process.cwd() }) {
    this.options = options;
    /** 配置 */
    this.config = [];
    /** 获取接口分类列表 */
    this.fetchExport = vtils.memoize(
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
    this.fetchProject = vtils.memoize(
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
    this.config = vtils.castArray(config);
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
            ...vtils.castArray(project.token).map((token) => ({
              ...project,
              token
            }))
          );
          return projects2;
        }, []);
        console.log("projects: ", projects);
        return Promise.all(
          projects.map(async (projectConfig, projectIndex) => {
            const projectInfo = await this.fetchProjectInfo({
              ...serverConfig,
              ...projectConfig
            });
            console.log("projectInfo: ", projectInfo);
            await Promise.all(
              projectConfig.categories.map(async (categoryConfig, categoryIndex) => {
                let categoryIds = vtils.castArray(categoryConfig.id);
                if (categoryIds.includes(0)) {
                  categoryIds.push(...projectInfo.cats.map((cat) => cat._id));
                }
                categoryIds = vtils.uniq(categoryIds);
                const excludedCategoryIds = categoryIds.filter((id) => id < 0).map(Math.abs);
                categoryIds = categoryIds.filter((id) => !excludedCategoryIds.includes(Math.abs(id)));
                categoryIds = categoryIds.filter((id) => !!projectInfo.cats.find((cat) => cat._id === id));
                categoryIds = categoryIds.sort();
                console.log("categoryIds: ", categoryIds);
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
                    interfaceList = interfaceList.map((interfaceInfo) => {
                      interfaceInfo._project = vtils.omit(projectInfo, ["cats"]);
                      const _interfaceInfo = vtils.isFunction(syntheticalConfig.preproccessInterface) ? syntheticalConfig.preproccessInterface(
                        vtils.cloneDeepFast(interfaceInfo),
                        changeCase__namespace,
                        syntheticalConfig
                      ) : interfaceInfo;
                      return _interfaceInfo;
                    }).filter(Boolean);
                    interfaceList.sort((a, b) => a._id - b._id);
                    const interfaceCodes = await Promise.all(
                      interfaceList.map(async (interfaceInfo) => {
                        const outputFilePath = path__default.resolve(
                          this.options.cwd,
                          typeof syntheticalConfig.outputFilePath === "function" ? syntheticalConfig.outputFilePath(interfaceInfo, changeCase__namespace) : syntheticalConfig.outputFilePath
                        );
                        const categoryUID = `_${serverIndex}_${projectIndex}_${categoryIndex}_${categoryIndex2}`;
                        const { typeCode: code, fetchConstruction } = await this.generateInterfaceCode(
                          syntheticalConfig,
                          interfaceInfo
                          // categoryUID,
                        );
                        const weights = [serverIndex, projectIndex, categoryIndex, categoryIndex2];
                        return {
                          categoryUID,
                          outputFilePath,
                          weights,
                          code,
                          fetchConstruction,
                          type: "type"
                        };
                      })
                    );
                    const fetchFunctions = interfaceCodes.map((e) => ({
                      ...e,
                      type: "fn",
                      outputFilePath: e.outputFilePath,
                      code: syntheticalConfig.requestStatement ? syntheticalConfig.requestStatement(e.fetchConstruction) : ""
                    }));
                    const groupedInterfaceCodes = vtils.groupBy(
                      interfaceCodes.map((e) => {
                        e.outputFilePath = e.outputFilePath.replace(/\w+\.ts$/, "typings.d.ts");
                        e.type = "type";
                        return e;
                      }).concat(fetchFunctions),
                      (item) => item.outputFilePath
                    );
                    return Object.keys(groupedInterfaceCodes).map((outputFilePath) => {
                      const data = groupedInterfaceCodes[outputFilePath];
                      const categoryCode = [...sortByWeights(data).map((item) => item.code)].filter(Boolean).join("\n\n");
                      const type = data[0].type;
                      if (!outputFileList[outputFilePath]) {
                        outputFileList[outputFilePath] = {
                          syntheticalConfig,
                          content: [],
                          type,
                          requestFunctionFilePath: syntheticalConfig.requestFunctionFilePath ? path__default.resolve(this.options.cwd, syntheticalConfig.requestFunctionFilePath) : path__default.join(path__default.dirname(outputFilePath), "request.ts"),
                          requestHookMakerFilePath: syntheticalConfig.reactHooks && syntheticalConfig.reactHooks.enabled ? syntheticalConfig.reactHooks.requestHookMakerFilePath ? path__default.resolve(
                            this.options.cwd,
                            syntheticalConfig.reactHooks.requestHookMakerFilePath
                          ) : path__default.join(path__default.dirname(outputFilePath), "makeRequestHook.ts") : ""
                        };
                      }
                      return {
                        type,
                        outputFilePath,
                        code: categoryCode,
                        weights: vtils.last(sortByWeights(groupedInterfaceCodes[outputFilePath])).weights
                      };
                    });
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
      (cat) => !vtils.isEmpty(cat) && !vtils.isEmpty(cat.list) && cat.list[0].catid === id
    );
    if (category) {
      category.list.forEach((interfaceInfo) => {
        interfaceInfo._category = vtils.omit(category, ["list"]);
      });
    }
    return category ? category.list : [];
  }
  /** 生成接口代码 */
  async generateInterfaceCode(syntheticalConfig, interfaceInfo) {
    const extendedInterfaceInfo = {
      ...interfaceInfo,
      parsedPath: path__default.parse(interfaceInfo.path)
    };
    const requestFunctionName = vtils.isFunction(syntheticalConfig.getRequestFunctionName) ? await syntheticalConfig.getRequestFunctionName(extendedInterfaceInfo, changeCase__namespace) : changeCase__namespace.camelCase(extendedInterfaceInfo.parsedPath.name);
    const requestDataTypeName = vtils.isFunction(syntheticalConfig.getRequestDataTypeName) ? await syntheticalConfig.getRequestDataTypeName(extendedInterfaceInfo, changeCase__namespace) : changeCase__namespace.pascalCase(`${requestFunctionName}Request`);
    const responseDataTypeName = vtils.isFunction(syntheticalConfig.getResponseDataTypeName) ? await syntheticalConfig.getResponseDataTypeName(extendedInterfaceInfo, changeCase__namespace) : changeCase__namespace.pascalCase(`${requestFunctionName}Response`);
    const requestDataJsonSchema = getRequestDataJsonSchema(
      extendedInterfaceInfo,
      syntheticalConfig.customTypeMapping || {}
    );
    const requestDataType = await jsonSchemaToType(requestDataJsonSchema, requestDataTypeName);
    const responseDataJsonSchema = getResponseDataJsonSchema(
      extendedInterfaceInfo,
      syntheticalConfig.customTypeMapping || {},
      syntheticalConfig.dataKey
    );
    const responseDataType = await jsonSchemaToType(responseDataJsonSchema, responseDataTypeName);
    const genComment = (genTitle) => {
      const {
        enabled: isEnabled = true,
        title: hasTitle = true,
        category: hasCategory = true,
        tag: hasTag = true,
        requestHeader: hasRequestHeader = true,
        updateTime: hasUpdateTime = true,
        link: hasLink = true,
        extraTags
      } = {
        ...syntheticalConfig.comment
      };
      if (!isEnabled) {
        return "";
      }
      const escapedTitle = String(extendedInterfaceInfo.title).replace(/\//g, "\\/");
      const description = hasLink ? `[${escapedTitle}\u2197](${extendedInterfaceInfo._url})` : escapedTitle;
      const summary = [
        hasCategory && {
          label: "\u5206\u7C7B",
          value: hasLink ? `[${extendedInterfaceInfo._category.name}\u2197](${extendedInterfaceInfo._category._url})` : extendedInterfaceInfo._category.name
        },
        hasTag && {
          label: "\u6807\u7B7E",
          value: extendedInterfaceInfo.tag.map((tag) => `\`${tag}\``)
        },
        hasRequestHeader && {
          label: "\u8BF7\u6C42\u5934",
          value: `\`${extendedInterfaceInfo.method.toUpperCase()} ${extendedInterfaceInfo.path}\``
        },
        hasUpdateTime && {
          label: "\u66F4\u65B0\u65F6\u95F4",
          value: process.env.JEST_WORKER_ID ? String(extendedInterfaceInfo.up_time) : (
            /* istanbul ignore next */
            `\`${dayjs__default(extendedInterfaceInfo.up_time * 1e3).format("YYYY-MM-DD HH:mm:ss")}\``
          )
        }
      ];
      if (typeof extraTags === "function") {
        const tags = extraTags(extendedInterfaceInfo);
        for (const tag of tags) {
          (tag.position === "start" ? summary.unshift : summary.push).call(summary, {
            label: tag.name,
            value: tag.value
          });
        }
      }
      const titleComment = hasTitle ? vtils.dedent`
            * ${genTitle(description)}
            *
          ` : "";
      const extraComment = summary.filter((item) => typeof item !== "boolean" && !vtils.isEmpty(item.value)).map((item) => {
        const _item = item;
        return `* @${_item.label} ${vtils.castArray(_item.value).join(", ")}`;
      }).join("\n");
      return vtils.dedent`
        /**
         ${[titleComment, extraComment].filter(Boolean).join("\n")}
         */
      `;
    };
    const fetchConstruction = {
      comment: genComment((title) => `\u63A5\u53E3 ${title} \u7684 **\u8BF7\u6C42\u51FD\u6570**`),
      requestFunctionName,
      requestDataTypeName,
      responseDataTypeName,
      path: JSON.stringify(extendedInterfaceInfo.path),
      method: extendedInterfaceInfo.method
    };
    return {
      fetchConstruction,
      typeCode: vtils.dedent`
      ${genComment((title) => `\u63A5\u53E3 ${title} \u7684 **\u8BF7\u6C42\u7C7B\u578B**`)}
      ${requestDataType.trim()}

      ${genComment((title) => `\u63A5\u53E3 ${title} \u7684 **\u8FD4\u56DE\u7C7B\u578B**`)}
      ${responseDataType.trim()}
    `
    };
  }
}

TSNode__default.register({
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
  let spinner = ora__default("\u6B63\u5728\u83B7\u53D6\u6570\u636E\u5E76\u751F\u6210\u4EE3\u7801...").start();
  try {
    const delayNotice = vtils.wait(5e3);
    delayNotice.then(() => {
      spinner.text = `\u6B63\u5728\u83B7\u53D6\u6570\u636E\u5E76\u751F\u6210\u4EE3\u7801... (\u82E5\u957F\u65F6\u95F4\u5904\u4E8E\u6B64\u72B6\u6001\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u6709\u63A5\u53E3\u5B9A\u4E49\u7684\u6570\u636E\u8FC7\u5927\u5BFC\u81F4\u62C9\u53D6\u6216\u89E3\u6790\u7F13\u6162)`;
    });
    await generator.prepare();
    delayNotice.cancel();
    const output = await generator.generate();
    spinner.stop();
    consola__default.success("\u83B7\u53D6\u6570\u636E\u5E76\u751F\u6210\u4EE3\u7801\u5B8C\u6BD5");
    await generator.write(output);
    consola__default.success("\u5199\u5165\u6587\u4EF6\u5B8C\u6BD5");
    await config.hooks?.success?.();
  } catch (err) {
    spinner?.stop();
    await config?.hooks?.fail?.();
    consola__default.error(err);
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
    configTSFile = path__default.join(cwd, "ytm.config.ts");
    configJSFile = path__default.join(cwd, "ytm.config.js");
    const configTSFileExist = await fs__default.pathExists(configTSFile);
    const configJSFileExist = !configTSFileExist && await fs__default.pathExists(configJSFile);
    configFileExist = configTSFileExist || configJSFileExist;
    configFile = configTSFileExist ? configTSFile : configJSFile;
  } else {
    useCustomConfigFile = true;
    configFile = options.configFile;
    cwd = path__default.dirname(configFile);
    configFileExist = await fs__default.pathExists(configFile);
  }
  if (!configFileExist) {
    return consola__default.error(`\u627E\u4E0D\u5230\u914D\u7F6E\u6587\u4EF6: ${useCustomConfigFile ? configFile : `${configTSFile} \u6216 ${configJSFile}`}`);
  }
  consola__default.success(`\u627E\u5230\u914D\u7F6E\u6587\u4EF6: ${configFile}`);
  const config = require(configFile).default;
  console.log(config);
  await ytm(config);
}
if (require.main === module) {
  const argv = yargs__default(process.argv).alias("c", "config").argv;
  run(argv._[2], {
    configFile: argv.config ? path__default.resolve(process.cwd(), argv.config) : void 0
  });
}

exports.default = ytm;
exports.run = run;
