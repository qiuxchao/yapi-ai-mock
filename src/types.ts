import { ParsedPath } from 'path';
import { OmitStrict, LiteralUnion, AsyncOrSync } from 'vtils/types';
import { Error, Success, TypeChatLanguageModel } from './chat/typechat';
import { AxiosStatic } from 'axios';
import { MockServerPluginOptions } from './mock/types';
export interface ChangeCase {
  /**
   * @example
   * changeCase.camelCase('test string') // => 'testString'
   */
  camelCase: (value: string) => string;
  /**
   * @example
   * changeCase.constantCase('test string') // => 'TEST_STRING'
   */
  constantCase: (value: string) => string;
  /**
   * @example
   * changeCase.dotCase('test string') // => 'test.string'
   */
  dotCase: (value: string) => string;
  /**
   * @example
   * changeCase.headerCase('test string') // => 'Test-String'
   */
  headerCase: (value: string) => string;
  /**
   * @example
   * changeCase.lowerCase('TEST STRING') // => 'test string'
   */
  lowerCase: (value: string) => string;
  /**
   * @example
   * changeCase.lowerCaseFirst('TEST') // => 'tEST'
   */
  lowerCaseFirst: (value: string) => string;
  /**
   * @example
   * changeCase.paramCase('test string') // => 'test-string'
   */
  paramCase: (value: string) => string;
  /**
   * @example
   * changeCase.pascalCase('test string') // => 'TestString'
   */
  pascalCase: (value: string) => string;
  /**
   * @example
   * changeCase.pathCase('test string') // => 'test/string'
   */
  pathCase: (value: string) => string;
  /**
   * @example
   * changeCase.sentenceCase('testString') // => 'Test string'
   */
  sentenceCase: (value: string) => string;
  /**
   * @example
   * changeCase.snakeCase('test string') // => 'test_string'
   */
  snakeCase: (value: string) => string;
  /**
   * @example
   * changeCase.swapCase('Test String') // => 'tEST sTRING'
   */
  swapCase: (value: string) => string;
  /**
   * @example
   * changeCase.titleCase('a simple test') // => 'A Simple Test'
   */
  titleCase: (value: string) => string;
  /**
   * @example
   * changeCase.upperCase('test string') // => 'TEST STRING'
   */
  upperCase: (value: string) => string;
  /**
   * @example
   * changeCase.upperCaseFirst('test') // => 'Test'
   */
  upperCaseFirst: (value: string) => string;
}

/** 请求方式 */
export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  PATCH = 'PATCH',
}

/** 请求数据类型 */
export enum RequestBodyType {
  /** 查询字符串 */
  query = 'query',
  /** 表单 */
  form = 'form',
  /** JSON */
  json = 'json',
  /** 纯文本 */
  text = 'text',
  /** 文件 */
  file = 'file',
  /** 原始数据 */
  raw = 'raw',
  /** 无请求数据 */
  none = 'none',
}

/** 请求路径参数类型 */
export enum RequestParamType {
  /** 字符串 */
  string = 'string',
  /** 数字 */
  number = 'number',
}

/** 请求查询参数类型 */
export enum RequestQueryType {
  /** 字符串 */
  string = 'string',
  /** 数字 */
  number = 'number',
}

/** 请求表单条目类型 */
export enum RequestFormItemType {
  /** 纯文本 */
  text = 'text',
  /** 文件 */
  file = 'file',
}

/** 返回数据类型 */
export enum ResponseBodyType {
  /** JSON */
  json = 'json',
  /** 纯文本 */
  text = 'text',
  /** XML */
  xml = 'xml',
  /** 原始数据 */
  raw = 'raw',

  // yapi 实际上返回的是 json，有另外的字段指示其是否是 json schema
  /** JSON Schema */
  // jsonSchema = 'json-schema',
}

/** 是否必需 */
export enum Required {
  /** 不必需 */
  false = '0',
  /** 必需 */
  true = '1',
}

/** 分类信息 */
export interface Category {
  /** ID */
  _id: number;
  /** 分类在 YApi 上的地址（自行实现） */
  _url: string;
  /** 分类名称 */
  name: string;
  /** 分类备注 */
  desc: string;
  /** 分类接口列表 */
  list: InterfaceList;
  /** 创建时间（unix时间戳） */
  add_time: number;
  /** 更新时间（unix时间戳） */
  up_time: number;
}

/** 分类列表，对应数据导出的 json 内容 */
export type CategoryList = Category[];

/** 接口定义 */
export interface Interface {
  /** 接口 ID */
  _id: number;
  /** 所属分类信息（自行实现） */
  _category: OmitStrict<Category, 'list'>;
  /** 所属项目信息（自行实现） */
  _project: Project;
  /** 接口在 YApi 上的地址（自行实现） */
  _url: string;
  /** 接口的 Mock 代码（自行实现） */
  _mockCode: string;
  /** 输入代码路径（自行实现） */
  _outputFilePath: string;
  /** 解析后的 res_body（自行实现） */
  _parsedResBody: object;
  /** 接口响应数据 hash 值（自行实现） */
  _hash: string;
  /** 是否响应数据过大无法生成（自行实现） */
  _isResponseDataTooLarge: boolean;
  /** 接口名称 */
  title: string;
  /** 状态 */
  status: LiteralUnion<'done' | 'undone', string>;
  /** 接口备注 */
  markdown: string;
  /** 请求路径 */
  path: string;
  /** 请求方式，HEAD、OPTIONS 处理与 GET 相似，其余处理与 POST 相似 */
  method: Method;
  /** 所属项目 id */
  project_id: number;
  /** 所属分类 id */
  catid: number;
  /** 标签列表 */
  tag: string[];
  /** 请求头 */
  req_headers: Array<{
    /** 名称 */
    name: string;
    /** 值 */
    value: string;
    /** 备注 */
    desc: string;
    /** 示例 */
    example: string;
    /** 是否必需 */
    required: Required;
  }>;
  /** 路径参数 */
  req_params: Array<{
    /** 名称 */
    name: string;
    /** 备注 */
    desc: string;
    /** 示例 */
    example: string;
    /** 类型（YApi-X） */
    type?: RequestParamType;
  }>;
  /** 仅 GET：请求串 */
  req_query: Array<{
    /** 名称 */
    name: string;
    /** 备注 */
    desc: string;
    /** 示例 */
    example: string;
    /** 是否必需 */
    required: Required;
    /** 类型（YApi-X） */
    type?: RequestQueryType;
  }>;
  /** 仅 POST：请求内容类型。为 text, file, raw 时不必特殊处理。 */
  req_body_type: RequestBodyType;
  /** `req_body_type = json` 时是否为 json schema */
  req_body_is_json_schema: boolean;
  /** `req_body_type = form` 时的请求内容 */
  req_body_form: Array<{
    /** 名称 */
    name: string;
    /** 类型 */
    type: RequestFormItemType;
    /** 备注 */
    desc: string;
    /** 示例 */
    example: string;
    /** 是否必需 */
    required: Required;
  }>;
  /** `req_body_type = json` 时的请求内容 */
  req_body_other: string;
  /** 返回数据类型 */
  res_body_type: ResponseBodyType;
  /** `res_body_type = json` 时是否为 json schema */
  res_body_is_json_schema: boolean;
  /** 返回数据 */
  res_body: string;
  /** 创建时间（unix时间戳） */
  add_time: number;
  /** 更新时间（unix时间戳） */
  up_time: number;
  /** 创建人 ID */
  uid: number;
  [key: string]: any;
}

/** 扩展接口定义 */
export interface ExtendedInterface extends Interface {
  parsedPath: ParsedPath;
}

/** 接口列表 */
export type InterfaceList = Interface[];

/** 项目信息 */
export interface Project {
  /** ID */
  _id: number;
  /** 项目在 YApi 上的地址（自行实现） */
  _url: string;
  /** 名称 */
  name: string;
  /** 描述 */
  desc: string;
  /** 基本路径 */
  basepath: string;
  /** 标签 */
  tag: string[];
  /** 环境配置 */
  env: Array<{
    /** 环境名称 */
    name: string;
    /** 环境域名 */
    domain: string;
  }>;
}

/** 支持生成注释的相关配置 */
export interface CommentConfig {
  /**
   * 是否开启该项功能。
   *
   * @default true
   */
  enabled?: boolean;

  /**
   * 是否有标题。
   *
   * @default true
   */
  title?: boolean;

  /**
   * 是否有分类名称。
   *
   * @default true
   */
  category?: boolean;

  /**
   * 是否有标签。
   *
   * @default true
   */
  tag?: boolean;

  /**
   * 是否有请求头。
   *
   * @default true
   */
  requestHeader?: boolean;

  /**
   * 是否有更新时间。
   *
   * @default true
   */
  updateTime?: boolean;

  /**
   * 是否为标题、分类名称添加链接。
   *
   * @default true
   */
  link?: boolean;

  /**
   * 额外的注释标签。生成的内容形如：`@{name} {value}`。
   */
  extraTags?: (interfaceInfo: ExtendedInterface) => Array<{
    /**
     * 标签名。
     */
    name: string;

    /**
     * 标签值。
     */
    value: string;

    /**
     * 标签位置，即将新标签插在标签列表的开头还是末尾。
     *
     * @default 'end'
     */
    position?: 'start' | 'end';
  }>;
}

/**
 * 共享的配置。
 */
export interface SharedConfig {
  /**
   * 要生成的目标代码类型。
   * 默认为 `typescript`。
   *
   * 设置为 `javascript` 时，将会根据当前项目的 `package.json` 中的 `type` 字段来决定生成文件的后缀名，如果 `type` 为 `module`，则生成 `.js` 后缀名，否则生成 `.mjs` 后缀名。
   *
   * @default 'typescript'
   */
  target?: 'javascript' | 'typescript';

  /**
   * 支持生成注释的相关配置。
   */
  comment?: CommentConfig;

  /**
   * 预处理接口信息，返回新的接口信息。可返回 false 排除当前接口。
   *
   * 譬如你想对接口的 `path` 进行某些处理或者想排除某些接口，就可使用该方法。
   *
   * @param interfaceInfo 接口信息
   * @param changeCase 常用的大小写转换函数集合对象
   * @param syntheticalConfig 作用到当前接口的最终配置
   * @example
   *
   * ```js
   * interfaceInfo => {
   *   interfaceInfo.path = interfaceInfo.path.replace('v1', 'v2')
   *   return interfaceInfo
   * }
   * ```
   */
  preproccessInterface?: (
    interfaceInfo: Interface,
    changeCase: ChangeCase,
    syntheticalConfig: SyntheticalConfig,
  ) => Interface | false;
}

/**
 * 分类的配置。
 */
export interface CategoryConfig extends SharedConfig {
  /**
   * 分类 ID，可以设置多个。设为 `0` 时表示全部分类。
   *
   * 如果需要获取全部分类，同时排除指定分类，可以这样：`[0, -20, -21]`，分类 ID 前面的负号表示排除。
   *
   * 获取方式：打开项目 --> 点开分类 --> 复制浏览器地址栏 `/api/cat_` 后面的数字。
   *
   * @example 20
   */
  id: number | number[];
}

/**
 * 项目的配置。
 */
export interface ProjectConfig extends SharedConfig {
  /**
   * 项目的唯一标识。支持多个项目。
   *
   * 获取方式：打开项目 --> `设置` --> `token配置` --> 复制 token。
   *
   * @example 'e02a47135259d0c1973a9ff8xsbb30685d64abc7df39edaa1ac6b6a792a647d'
   */
  token: string | string[];

  /**
   * 分类列表。
   */
  categories: CategoryConfig[];
}

/**
 * mock 服务配置。
 */
export interface MockServerConfig extends MockServerPluginOptions {
  /**
   * mock 服务端口。默认为 `3000`。
   *
   * @default 3000
   */
  port?: number;
}

export interface ServerConfig extends SharedConfig {
  /**
   * yapi 服务地址。
   *
   * @example 'http://yapi.foo.bar'
   */
  serverUrl: string;

  /**
   * 项目列表
   */
  projects: ProjectConfig[];
}

/** 命令行钩子 */
export interface CliHooks {
  /** 生成成功时触发 */
  success?: () => AsyncOrSync<void>;
  /** 生成失败时触发 */
  fail?: () => AsyncOrSync<void>;
  /** 生成完毕时触发（无论成功、失败） */
  complete?: () => AsyncOrSync<void>;
}

/** 配置。 */
export interface Config {
  /**
   * yapi 服务相关配置。
   *
   * 可以配置为一个列表，用于同时生成多个 yapi 服务的接口。
   */
  yapi: ServerConfig | ServerConfig[];

  /**
   * 钩子。
   */
  hooks?: CliHooks;

  /**
   * 环境变量文件路径。默认为项目根目录下的 `.env`。
   *
   * 可以是 `相对路径` 或 `绝对路径`。
   *
   * 可以在其中配置 `OPENAI_API_KEY` 等[环境变量](https://github.com/qiuxchao/yapi-ai-mock#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)。
   *
   * @default '.env'
   */
  envPath?: string;

  /**
   * 生成 mock 文件目录路径。默认为 `mock`。
   *
   * 配置改项后，生成的 mock 文件会放在该目录下。
   *
   * 可以是 `相对路径` 或 `绝对路径`。
   *
   * @example 'mock'
   * @example 'src/mock'
   *
   * @default 'mock'
   */
  mockDir?: string;

  /**
   * mock 接口前缀。默认为 `/mock`。
   *
   * 生成的 mock 文件中，接口的路径会加上该前缀。
   *
   * @default '/mock'
   */
  mockPrefix?: string;

  /**
   * 给 LLM 的类型提示文件路径。默认为 `yapi-ai-mock/lib/assets/mockSchema.ts`。
   *
   * 可以是 `相对路径` 或 `绝对路径`。
   *
   * 如果配置了此项，请确保文件中有 `MockResponse` 和 `ResponseBodyType` 两个类型。
   *
   * 此选项的配置可以参考 [TypeChat Examples](https://github.com/microsoft/TypeChat/tree/main/examples)
   *
   * @default 'assets/mockSchema.ts'
   */
  mockSchemaPath?: `${string}.ts`;

  /**
   * 给 LLM 的期望的 mock 结果的类型定义。
   *
   * 如果配置了 `mockSchemaPath`，则此配置项无效。
   *
   * 此配置项会与 `yapi-ai-mock/lib/assets/mockSchema.ts` 进行合并，然后将合并后的结果传输给 LLM。
   *
   * 格式为 typescript 类型字符串。
   *
   * @example
   *
   * `{
   * 	// response code (default: 200)
   * 	code?: 200 | '200';
   * 	// response message (default: success)
   * 	message?: 'success';
   * 	// response message data (default: null)
   * 	// If it has currentPage field, its value is 1
   * 	// If there is a field related to the name of the person in the data, it will be simulated as a Chinese name
   * 	data: any;
   * }`
   *
   * @default
   *
   * 'any'
   */
  mockResponseBodyType?: string;

  /**
   * LLM 支持的 Tokens 数量，默认为 `4096`。
   *
   * 可以通过调整此配置项来控制每次向 LLM 发送的数据量，但不能超过 LLM 支持的最大 Tokens 数。
   *
   * @default
   * 4096
   */
  llmTokens?: number;

  /**
   * 自定义 LLM。如果在环境变量中设置了 `OPENAI_API_KEY`，则此配置项无效。（因为会直接使用 openai ChatGPT 的模型）
   *
   *
   * @param axios axios 方法
   * @param success 成功回调
   * @param error 失败回调
   * @param apiEndpoint api 地址，可通过环境变量 `OPENAI_ENDPOINT` 设置，默认为 `https://api.openai.com/v1/chat/completions`
   *
   * @returns [TypeChatLanguageModel](https://github.com/microsoft/TypeChat/blob/main/src/model.ts#L10C28-L10C28)
   *
   *
   * @example
   *(axios, success, error, apiEndpoint) => ({
   * 	complete: async (prompt) => {
   *			try {
   *				const response = await axios(apiEndpoint, {
   *					method: 'POST',
   *					headers: {
   *						Authorization: `Bearer ${apiKey}`,
   *						'Content-Type': 'application/json',
   *					},
   *					data: JSON.stringify({
   *						temperature: 0,
   *						n: 1,
   *						messages: [{ role: 'user', content: prompt }],
   *					}),
   *				});
   *				const json = response.data;
   *				return success((json?.data?.content as string) ?? '');
   *			} catch (err) {
   *				return error(`LLM fetch error: ${err}`);
   *			}
   *		}
   *})
   */
  createLanguageModel?: (
    axios: AxiosStatic,
    success: <T>(data: T) => Success<T>,
    error: (message: string) => Error,
    apiEndpoint: string,
  ) => TypeChatLanguageModel;

  /**
   * 自定义的对 LLM 返回的 mock 结果进行处理，使其符合预期。
   *
   * 如果不设置，则直接使用 LLM 返回的 mock 结果。
   *
   * @param mockResult LLM 返回的 mock 结果
   * @param interfaceInfo 接口信息
   *
   * @example
   *
   * ```ts
   * (mockResult, interfaceInfo) => {
   * 	if (mockResult?.hasOwnProperty('code')) {
   * 		mockResult.code = 200;
   * 	}
   * 	if (mockResult?.hasOwnProperty('message')) {
   * 		mockResult.message = 'success';
   * 	}
   * }
   * ```
   */
  processMockResult?: (mockResult: any, interfaceInfo: Interface) => void;

  /**
   * mock 服务配置。
   *
   * mock 服务是一个 http 服务，用于拦截请求并返回 mock 数据。
   *
   * 当你的项目不是 webpack 或 vite 等工具构建的 SPA 项目时，应当使用 mock 服务。
   *
   * 使用 `npx yam serve` 命令启动 mock 服务。
   */
  mockServer?: MockServerConfig;

  /**
   * 自定义生成的 mock 代码片段。
   *
   * 使用此方法可以自定义生成结果中的 mock 代码片段，如果不设置，则使用默认的 mock 代码片段。
   *
   * @default
   *
   * ```js
   * `
   * /* hash: ${mockConstruction.hash} *\/
   * ${mockConstruction.comment}
   * export default defineMock({
   * 	url: '${config.mockPrefix || '/mock'}${mockConstruction.path}',
   * 	method: '${mockConstruction.method}',
   * 	body: mockjs.mock(
   * 		${mockConstruction.mockCode || '{}'}
   * 	),
   * });
   * `
   * ```
   */
  mockStatement?: (mockConstruction: MockConstruction) => string;

  /**
   * 生成的文件顶部引入部分的代码片段。
   *
   * @default
   * ```js
   * `
   * import mockjs from 'mockjs';
   * import { defineMock } from 'yapi-ai-mock';
   * `
   * ```
   */
  mockImportStatement?: () => string;
}

/** mock 代码片段配置 */
export interface MockConstruction {
  /** 注释 */
  comment: string;
  /** 请求路径 */
  path: string;
  /** 请求方法 */
  method: Method;
  /** LLM 生成的 mock 代码 */
  mockCode: string;
  /**
   * 接口响应数据 hash 值，将此值注入到生成的代码中，用于判断接口数据是否更新。
   *
   * 注入格式: /* hash: ${mockConstruction.hash} &#42;&#47;
   */
  hash: string;
}

/** 混合的配置。 */
export type SyntheticalConfig = Partial<
  ServerConfig & ServerConfig['projects'][0] & ServerConfig['projects'][0]['categories'][0]
>;
