/* eslint-disable max-nested-callbacks */
import {
  castArray,
  dedent,
  isEmpty,
  memoize,
  omit,
  uniq,
  isFunction,
  indent,
  cloneDeepFast,
} from 'vtils';
import * as changeCase from 'change-case';
import {
  Category,
  CategoryConfig,
  CategoryList,
  CommentConfig,
  Config,
  ExtendedInterface,
  Interface,
  MockConstruction,
  Project,
  ProjectConfig,
  ServerConfig,
  SyntheticalConfig,
  InterfaceList,
} from '@/types';
import {
  getCachedPrettierOptions,
  httpGet,
  throwError,
  removeInvalidProperty,
  processMockResult,
  transformWithEsbuild,
} from '@/utils';
import * as fs from 'fs-extra';
import path from 'path';
import dayjs from 'dayjs';
import prettier from 'prettier';
import chat from '@/chat';
import consola from 'consola';
import { Ora } from 'ora';
import { SHA256 } from 'crypto-js';
import { LLM_TOKENS } from '@/constant';

interface OutputFileList {
  [outputFilePath: string]: {
    syntheticalConfig: SyntheticalConfig;
    content: string[];
  };
}

interface SyntheticalInterface {
  syntheticalConfig: SyntheticalConfig;
  interfaceInfo: Interface;
}

/** 生成代码 */
export class Generator {
  /** 配置 */
  private config: Omit<Config, 'yapi'> = {};
  /** yapi 服务配置 */
  private serverConfig: ServerConfig[] = [];
  /** 总任务数 */
  private total = 0;
  /** 完成的任务数 */
  private completed = 0;
  /** 接口列表 */
  private interfaceList: SyntheticalInterface[] = [];
  /** 宿主项目的 package.json */
  private packageJson: any = {};
  /** 宿主项目是否为ESM */
  private isESM = false;

  /** 获取接口分类列表 */
  private fetchExport: ({
    serverUrl,
    token,
  }: Partial<ServerConfig & ProjectConfig & CategoryConfig>) => Promise<Category[]> = memoize(
    async ({ serverUrl, token }: SyntheticalConfig) => {
      const projectInfo = await this.fetchProject({ serverUrl, token });
      const categoryList = await this.fetchApi<CategoryList>(`${serverUrl}/api/plugin/export`, {
        type: 'json',
        status: 'all',
        isWiki: 'false',
        token: token!,
      });
      return categoryList.map(cat => {
        const projectId = cat.list?.[0]?.project_id || 0;
        const catId = cat.list?.[0]?.catid || 0;
        // 实现分类在 YApi 上的地址
        cat._url = `${serverUrl}/project/${projectId}/interface/api/cat_${catId}`;
        cat.list = (cat.list || []).map(item => {
          const interfaceId = item._id;
          // 实现接口在 YApi 上的地址
          item._url = `${serverUrl}/project/${projectId}/interface/api/${interfaceId}`;
          item.path = `${projectInfo.basepath}${item.path}`;
          return item;
        });
        return cat;
      });
    },
    ({ serverUrl, token }: SyntheticalConfig) => `${serverUrl}|${token}`,
  );

  /** 获取项目信息 */
  private fetchProject: ({
    serverUrl,
    token,
  }: Partial<ServerConfig & ProjectConfig & CategoryConfig>) => Promise<Project> = memoize(
    async ({ serverUrl, token }: SyntheticalConfig) => {
      const projectInfo = await this.fetchApi<Project>(`${serverUrl}/api/project/get`, {
        token: token!,
      });
      const basePath = `/${projectInfo.basepath || '/'}`.replace(/\/+$/, '').replace(/^\/+/, '/');
      projectInfo.basepath = basePath;
      // 实现项目在 YApi 上的地址
      projectInfo._url = `${serverUrl}/project/${projectInfo._id}/interface/api`;
      return projectInfo;
    },
    ({ serverUrl, token }: SyntheticalConfig) => `${serverUrl}|${token}`,
  );

  public constructor(
    config: Config,
    private options: { cwd: string } = { cwd: process.cwd() },
  ) {
    // server config 可能是对象或数组，统一为数组
    this.serverConfig = castArray(config.yapi);
    this.config = omit(config, ['yapi']);
  }

  /** 前置方法，统一配置项 */
  public async prepare(): Promise<void> {
    // 读取宿主项目的 package.json
    this.packageJson = await fs.readJSON(path.resolve(this.options.cwd, 'package.json'));
    this.isESM = this.packageJson.type === 'module';
    // 处理 yapi 服务配置
    this.serverConfig = await Promise.all(
      // config 可能是对象或数组，统一为数组
      this.serverConfig.map(async item => {
        const serverUrl = item.serverUrl?.replace(/\/+$/, '');
        if (!serverUrl) {
          throwError('未配置 yapi 服务地址，请通过配置文件中的 serverUrl 字段配置');
        }
        item.serverUrl = serverUrl;
        return item;
      }),
    );
  }

  /** 拉取并解析接口数据 */
  public async resolve(): Promise<number> {
    await Promise.all(
      this.serverConfig.map(async serverConfig => {
        const projects = serverConfig.projects.reduce<ProjectConfig[]>((projects, project) => {
          projects.push(
            ...castArray(project.token).map(token => ({
              ...project,
              token,
            })),
          );
          return projects;
        }, []);
        return Promise.all(
          projects.map(async projectConfig => {
            const projectInfo = await this.fetchProjectInfo({
              ...serverConfig,
              ...projectConfig,
            });
            await Promise.all(
              projectConfig.categories.map(async categoryConfig => {
                // 分类处理
                // 数组化
                let categoryIds = castArray(categoryConfig.id);
                // 全部分类
                if (categoryIds.includes(0)) {
                  categoryIds.push(...projectInfo.cats.map(cat => cat._id));
                }
                // 唯一化
                categoryIds = uniq(categoryIds);
                // 去掉被排除的分类
                const excludedCategoryIds = categoryIds.filter(id => id < 0).map(Math.abs);
                categoryIds = categoryIds.filter(id => !excludedCategoryIds.includes(Math.abs(id)));
                // 删除不存在的分类
                categoryIds = categoryIds.filter(
                  id => !!projectInfo.cats.find(cat => cat._id === id),
                );
                // 顺序化
                categoryIds = categoryIds.sort();

                await Promise.all(
                  categoryIds.map<Promise<void>>(async id => {
                    // eslint-disable-next-line no-param-reassign
                    categoryConfig = {
                      ...categoryConfig,
                      id,
                    };
                    const syntheticalConfig: SyntheticalConfig = {
                      ...serverConfig,
                      ...projectConfig,
                      ...categoryConfig,
                    };
                    syntheticalConfig.target = syntheticalConfig.target || 'typescript';

                    // 接口列表
                    let interfaceList = await this.fetchInterfaceList(syntheticalConfig);

                    interfaceList = interfaceList
                      .map(interfaceInfo => {
                        // 实现 _project 字段
                        interfaceInfo._project = omit(projectInfo, ['cats']);
                        // 实现 _outputFilePath 字段
                        const [_, projectName, categoryName, ...interfacePath] =
                          interfaceInfo.path.split('/');
                        interfaceInfo._outputFilePath = path.resolve(
                          this.options.cwd,
                          `${this.config?.mockDir || 'mock'}/${changeCase.camelCase(
                            projectName,
                          )}/${changeCase.camelCase(categoryName)}${
                            interfacePath.length
                              ? `/${changeCase.camelCase(interfacePath.join('-'))}`
                              : ''
                          }.${
                            syntheticalConfig.target === 'typescript'
                              ? 'ts'
                              : this.isESM
                              ? 'js'
                              : 'mjs'
                          }`,
                        );
                        // 对接口返回数据进行解析处理，如果无法解析，则忽略该接口
                        try {
                          const parsedResBody = JSON.parse(interfaceInfo.res_body);
                          // 过滤掉 `res_body` 中的 `$schema` 和 `required` 字段
                          removeInvalidProperty(parsedResBody);
                          interfaceInfo._parsedResBody = parsedResBody;
                        } catch (e) {
                          consola.warn(
                            `接口 ${interfaceInfo.path} 的 res_body 不是合法的 JSON 字符串，已忽略`,
                          );
                          return false;
                        }
                        // 根据 res_body 生成 hash，用来防止重新生成
                        interfaceInfo._hash = SHA256(interfaceInfo.res_body).toString();
                        // 判断是否需要重新生成
                        if (fs.existsSync(interfaceInfo._outputFilePath)) {
                          const content = fs.readFileSync(interfaceInfo._outputFilePath, 'utf8');
                          const match = content.match(/\/\* hash: ([^\*]+) \*\//);
                          if (match && match[1] === interfaceInfo._hash) {
                            return false;
                          }
                        }
                        // 预处理
                        const _interfaceInfo = isFunction(syntheticalConfig.preproccessInterface)
                          ? syntheticalConfig.preproccessInterface(
                              cloneDeepFast(interfaceInfo),
                              changeCase,
                              syntheticalConfig,
                            )
                          : interfaceInfo;
                        return _interfaceInfo;
                      })
                      .filter(Boolean) as any;
                    interfaceList.sort((a, b) => a._id - b._id);
                    this.interfaceList.push(
                      ...interfaceList.map(interfaceInfo => ({
                        syntheticalConfig,
                        interfaceInfo,
                      })),
                    );
                  }),
                );
              }),
            );
          }),
        );
      }),
    );
    this.total = this.interfaceList.length;
    return this.total;
  }

  /** 生成 */
  public async generate(spinner: Ora): Promise<void> {
    if (!this.interfaceList.length) return;
    await this.genMockCode(spinner);
  }

  /** 输出生成结果 */
  public async result(): Promise<void> {
    consola.success('代码生成完毕');
    consola.success(`生成数量: ${this.completed}/${this.total}`);
    if (this.completed !== this.total) {
      consola.warn('以下接口未能成功生成: ');
      this.interfaceList.forEach(({ interfaceInfo }) => {
        console.log(
          `- ${interfaceInfo.path}${
            interfaceInfo._isResponseDataTooLarge
              ? '（该接口响应数据过大，超出了 LLM 的 token 上限，请通过下面给出的第 2 种或第 3 种方法解决）'
              : ''
          } 🔗 ${interfaceInfo._url}`,
        );
      });
      console.log();
      consola.info(indent`可使用以下方法来处理未生成的接口：

1. 调整 Prompt，然后重新生成。 🔗 \`https://github.com/qiuxchao/yapi-ai-mock#mockschemapath\`
2. 在配置文件中的 mock 服务/插件/中间件配置中，通过 \`overwrite\` 方法来自定义以上接口。 🔗 \`https://github.com/qiuxchao/yapi-ai-mock#mockserver\`
3. 如果接口响应数据超出了 LLM 的 tokens 上限，也可尝试在配置文件中来调整 tokens 上限来解决。🔗 \`https://github.com/qiuxchao/yapi-ai-mock#llmtokens\`
      `);
    }
  }

  /** 写入文件 */
  private write(outputFileList: OutputFileList) {
    return Promise.all(
      Object.keys(outputFileList).map(async outputFilePath => {
        const { content } = outputFileList[outputFilePath];

        // 始终写入主文件
        const rawOutputContent = dedent`
          /* tslint:disable */
          /* eslint-disable */

          /* 该文件工具自动生成，请勿直接修改！！！ */
         
          // @ts-ignore

					${
            this.config?.mockImportStatement?.() ??
            `
					import mockjs from 'mockjs';
					import { defineMock } from 'yapi-ai-mock';
					`
          }
       
          ${content.join('\n\n').trim()}
        `;

        // ref: https://prettier.io/docs/en/options.html
        const [prettyOutputContent] = await this.prettierFile(rawOutputContent);
        const outputContent = `${dedent`
          /* prettier-ignore-start */
          ${prettyOutputContent}
          /* prettier-ignore-end */
        `}\n`;
        await fs.outputFile(outputFilePath, outputContent);

        // 生成 JavaScript 代码
        // if (syntheticalConfig.target === 'javascript') {
        // 	await this.tsc(outputFilePath);
        // 	await Promise.all([fs.remove(outputFilePath).catch(noop)]);
        // }
      }),
    );
  }

  /** 生成文件代码 */
  private generateCode(syntheticalConfig: SyntheticalConfig, interfaceInfo: Interface) {
    const extendedInterfaceInfo: ExtendedInterface = {
      ...interfaceInfo,
      parsedPath: path.parse(interfaceInfo.path),
    };

    // 接口注释
    const genComment = (genTitle: (title: string) => string) => {
      const {
        enabled: isEnabled = true,
        title: hasTitle = true,
        category: hasCategory = true,
        tag: hasTag = true,
        requestHeader: hasRequestHeader = true,
        updateTime: hasUpdateTime = true,
        link: hasLink = true,
        extraTags,
      }: CommentConfig = {
        ...syntheticalConfig.comment,
      };
      if (!isEnabled) {
        return '';
      }
      // 转义标题中的 /
      const escapedTitle = String(extendedInterfaceInfo.title).replace(/\//g, '\\/');
      const description = hasLink
        ? `[${escapedTitle}↗](${extendedInterfaceInfo._url})`
        : escapedTitle;
      const summary: Array<
        | false
        | {
            label: string;
            value: string | string[];
          }
      > = [
        hasCategory && {
          label: '分类',
          value: hasLink
            ? `[${extendedInterfaceInfo._category.name}↗](${extendedInterfaceInfo._category._url})`
            : extendedInterfaceInfo._category.name,
        },
        hasTag && {
          label: '标签',
          value: extendedInterfaceInfo.tag.map(tag => `\`${tag}\``),
        },
        hasRequestHeader && {
          label: '请求头',
          value: `\`${extendedInterfaceInfo.method.toUpperCase()} ${extendedInterfaceInfo.path}\``,
        },
        hasUpdateTime && {
          label: '接口更新时间',
          value: `\`${dayjs(extendedInterfaceInfo.up_time * 1000).format('YYYY-MM-DD HH:mm:ss')}\``,
        },
        {
          label: '文件生成时间',
          value: `\`${dayjs().format('YYYY-MM-DD HH:mm:ss')}\``,
        },
      ];
      if (typeof extraTags === 'function') {
        const tags = extraTags(extendedInterfaceInfo);
        for (const tag of tags) {
          (tag.position === 'start' ? summary.unshift : summary.push).call(summary, {
            label: tag.name,
            value: tag.value,
          });
        }
      }
      const titleComment = hasTitle
        ? dedent`
            * ${genTitle(description)}
            *
          `
        : '';
      const extraComment: string = summary
        .filter(item => typeof item !== 'boolean' && !isEmpty(item.value))
        .map(item => {
          const _item: Exclude<(typeof summary)[0], boolean> = item as any;
          return `* @${_item.label} ${castArray(_item.value).join(', ')}`;
        })
        .join('\n');
      return dedent`
        /**
         ${[titleComment, extraComment].filter(Boolean).join('\n')}
         */
      `;
    };

    // 接口元信息
    const mockConstruction: MockConstruction = {
      comment: genComment(title => `接口 ${title} 的 **Mock配置**`),
      path: extendedInterfaceInfo.path,
      method: extendedInterfaceInfo.method,
      mockCode: extendedInterfaceInfo._mockCode,
      hash: extendedInterfaceInfo._hash,
    };

    // 通过配置文件中的 `mockStatement` 方法来生成 mock 代码
    const code = isFunction(this.config?.mockStatement)
      ? this.config?.mockStatement(mockConstruction)
      : indent`
			/* hash: ${mockConstruction.hash} */

			${mockConstruction.comment}
			export default defineMock({
				url: '${this.config?.mockPrefix || '/mock'}${mockConstruction.path}',
				method: '${mockConstruction.method}',
				body: mockjs.mock(
					${mockConstruction.mockCode || '{}'}
				),
			});
		`;

    return code;
  }

  /** 生成 mock 代码 */
  private async genMockCode(spinner: Ora) {
    const maxLength = Math.floor(Number(this.config.llmTokens || LLM_TOKENS) * 1.5);

    // 读取 mockSchema
    const { mockSchemaPath, mockResponseBodyType } = this.config;
    if (mockSchemaPath && !fs.existsSync(path.resolve(process.cwd(), mockSchemaPath))) {
      throwError(`mockSchemaPath: ${mockSchemaPath} 不存在`);
    }
    const schemaPath = mockSchemaPath
      ? path.resolve(process.cwd(), mockSchemaPath)
      : path.join(__dirname, 'assets/mockSchema.ts');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    if (mockResponseBodyType && !mockSchemaPath) {
      schema = schema.replace(
        'ResponseBodyType = any',
        `ResponseBodyType = ${mockResponseBodyType}`,
      );
    }
    const [prettySchema] = await this.prettierFile(schema);
    // 剩余长度
    const surplusLength = maxLength - (prettySchema.length + 200);
    const responseBodyList = this.interfaceList
      .map(i => ({
        id: i?.interfaceInfo?._id,
        res_body: i?.interfaceInfo?._parsedResBody,
      }))
      .filter(i => {
        const condition = JSON.stringify(i.res_body).length < surplusLength - 20;
        if (!condition) {
          const originInterface = this.interfaceList.find(item => item?.interfaceInfo?._id === i.id)
            ?.interfaceInfo;
          originInterface && (originInterface._isResponseDataTooLarge = true);
        }
        return condition;
      });
    const inputList: string[] = [];
    // 输入按长度分组
    while (responseBodyList.length > 0) {
      const input: Record<number, object> = {};
      [...responseBodyList].forEach(item => {
        const _input = JSON.stringify({ ...input, [item.id]: item.res_body });
        if (_input.length < surplusLength) {
          input[item.id] = item.res_body;
          responseBodyList.splice(
            responseBodyList.findIndex(i => i.id === item.id),
            1,
          );
        }
      });
      Object.keys(input).length && inputList.push(JSON.stringify(input));
    }

    // 根据分组的输入，获取 mock 代码
    await Promise.all(
      inputList.map(async input => {
        const mockResult = await chat(input, prettySchema, this.config);
        const outputFileList: OutputFileList = Object.create(null);
        // 生成代码
        await Promise.all(
          Object.keys(mockResult).map(async id => {
            const { interfaceInfo, syntheticalConfig } =
              this.interfaceList.find(i => i?.interfaceInfo?._id === Number(id)) || {};
            if (interfaceInfo && syntheticalConfig) {
              // mock 结果处理
              isFunction(this.config?.processMockResult)
                ? this.config?.processMockResult(mockResult[Number(id)], interfaceInfo)
                : processMockResult(mockResult[Number(id)], interfaceInfo);
              interfaceInfo._mockCode = mockResult[Number(id)]
                ? JSON.stringify(mockResult[Number(id)])
                : '';
              const code = this.generateCode(syntheticalConfig, interfaceInfo);
              outputFileList[interfaceInfo._outputFilePath] = {
                syntheticalConfig,
                content: [code],
              };
            }
          }),
        );
        // 写入文件
        await this.write(outputFileList);
        // 更新进度
        const ids = Object.keys(mockResult);
        this.completed += ids.length;
        this.interfaceList = this.interfaceList.filter(
          i => !ids.includes(String(i?.interfaceInfo?._id)),
        );
        spinner.color = this.completed > 15 ? 'red' : 'yellow';
        spinner.text = `正在生成代码并写入文件... (已完成: ${this.completed}/${this.total})`;
      }),
    );
  }

  private async prettierFile(content: string): Promise<[string, boolean]> {
    let result = content;
    let hasError = false;
    try {
      result = await prettier.format(content, {
        ...(await getCachedPrettierOptions()),
      });
    } catch (error) {
      hasError = true;
    }
    return [result, hasError];
  }

  /** 编译 ts 文件为 js 并写入 */
  private async tsc(filepath: string): Promise<void> {
    const tsText = fs.readFileSync(filepath, 'utf-8');
    const { code } = await transformWithEsbuild(tsText, filepath);
    const outputFilePath = filepath.replace(/\.ts$/, '.mjs');
    await fs.outputFile(outputFilePath, code);
  }

  private async fetchApi<T = any>(url: string, query: Record<string, any>): Promise<T> {
    const res = await httpGet<{
      errcode: any;
      errmsg: any;
      data: any;
    }>(url, query);
    /* istanbul ignore next */
    if (res?.errcode) {
      throwError(res.errmsg);
    }
    return res.data || res;
  }

  /** 获取项目信息 */
  private async fetchProjectInfo(syntheticalConfig: SyntheticalConfig) {
    const projectInfo = await this.fetchProject(syntheticalConfig);
    const projectCats = await this.fetchApi<CategoryList>(
      `${syntheticalConfig.serverUrl}/api/interface/getCatMenu`,
      {
        token: syntheticalConfig.token!,
        project_id: projectInfo._id,
      },
    );
    return {
      ...projectInfo,
      cats: projectCats,
    };
  }

  /** 获取分类的接口列表 */
  private async fetchInterfaceList({
    serverUrl,
    token,
    id,
  }: SyntheticalConfig): Promise<InterfaceList> {
    const category = ((await this.fetchExport({ serverUrl, token })) || []).find(
      cat => !isEmpty(cat) && !isEmpty(cat.list) && cat.list[0].catid === id,
    );

    if (category) {
      category.list.forEach(interfaceInfo => {
        // 实现 _category 字段
        interfaceInfo._category = omit(category, ['list']);
      });
    }

    return category ? category.list : [];
  }
}
