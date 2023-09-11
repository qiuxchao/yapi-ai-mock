# yapi-ai-mock

<br>
<br>
<p align="center">
  <b>使用 LLM，将 YAPI 接口文档生成为本地的 Mock 文件。</b>
</p>

<p align="center">对 Vite 和 Webpack 项目提供 Mock 插件/中间件，其他项目可使用独立部署的 Mock 服务。</p>

<br>
<p align="center">
<a href="https://www.npmjs.com/package/yapi-ai-mock"><img alt="npm" src="https://img.shields.io/npm/v/yapi-ai-mock?style=flat-square"></a>
<img alt="node-current" src="https://img.shields.io/node/v/yapi-ai-mock?style=flat-square">
<img alt="npm" src="https://img.shields.io/npm/dt/yapi-ai-mock?style=flat-square">
<br>
</p>
<br>
<br>

## 特性

- 🛠️ 支持自定义 LLM 和 Prompt
- 🌐 支持 YAPI 多服务器、多项目、多分类
- 🤖 支持预处理接口信息
- 📝 完整的注释
- 🧱 支持自定义生成的代码块
- 🦾 支持生成 Typescript/JavaScript 代码
- 💡 支持 ESModule
- 🪝 支持生成流程的 Hooks
- 🧲 非注入式，对客户端代码无侵入
- 🔥 支持 Mock 文件热更新
- 📦 自动加载 Mock 文件
- ⚙️ 随意开启或关闭对某个接口的 Mock 配置
- 🗂 支持构建可独立部署的小型 Mock 服务

## 安装

```bash
# npm
npm i yapi-ai-mock -D

# yarn
yarn add yapi-ai-mock -D

# pnpm
pnpm add yapi-ai-mock -D
```

## 使用

1. 初始化配置文件：

```bash
# 生成默认的 ts 配置文件
npx yam init

# 生成 js 配置文件
npx yam init -t=js
```

2. 生成配置文件后，在配置文件中填写 YAPI 服务器相关配置和 LLM 相关配置，以及其他[配置项](#配置)。

3. 运行命令，生成 mock 文件：

```bash
npx yam
```

4. 在项目中使用 mock 文件：

- vite 或 webpack 项目，使用 mock [插件/中间件](#mock-插件中间件)

- 在其他项目中使用，直接启动 mock 服务器：

```bash
npx yam serve
```

5. 在项目中请求接口时，将接口地址改为 mock 服务器地址，例如：

```ts
// 请求地址为 http://api.foo.bar/path/to/api
// vite/webpack 项目改为 /mock/path/to/api
// 独立启动的 mock 服务改为 http://localhost:3000/mock/path/to/api
```

## 配置

当执行 `npx yam` 命令生成 mock 文件时，会默认读取当前目录下的 `yam.config.ts` 或 `yam.config.js` 文件，也可以通过 `-c` 参数指定配置文件路径。

在一个新项目中，可以通过 `npx yam init` 命令初始化一个配置文件，也可以手动创建配置文件。

配置文件示例：

```ts
// yam.config.ts
import { defineConfig } from 'yapi-ai-mock';

export default defineConfig({
  yapi: {
    // yapi 服务地址。
    serverUrl: 'http://yapi.foo.bar',
    // 项目列表
    projects: [
      {
        // 项目的唯一标识。支持多个项目。
        token: 'xxx',
        // 分类列表。
        categories: [
          {
            id: [0],
          },
        ],
      },
    ],
  },
});
```

### `yapi`

YAPI 服务相关配置。

可以配置为一个列表，用于同时生成多个 YAPI 服务的接口。

#### 公共配置

- 类型：

````ts
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
  preproccessInterface?(
    interfaceInfo: Interface,
    changeCase: ChangeCase,
    syntheticalConfig: SyntheticalConfig,
  ): Interface | false;
}
````

公共配置可以在服务器级别、项目级别、分类级别进行配置，如果存在相同的配置项，低级别的配置会覆盖高级别的配置。

#### `yapi.serverUrl`

- 类型：`string`
- 默认值：`''`

YAPI 服务地址。示例：`http://yapi.foo.bar`

#### `yapi.projects`

- 类型：

```ts
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
  categories: Array<{
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
  }>;
}
```

- 默认值：`[]`

项目列表。

### `envPath`

- 类型：`string`
- 默认值：`'.env''`

环境变量文件路径。

可以在其中配置 `OPENAI_API_KEY` 等[环境变量](#环境变量)。

### `mockDir`

- 类型：`string`
- 默认值：`'mock'`

生成 mock 文件目录路径。

配置改项后，生成的 mock 文件会放在该目录下。

### `mockPrefix`

- 类型：`string`
- 默认值：`'/mock'`

mock 接口前缀。

生成的 mock 文件中，接口的路径会加上该前缀。

### `mockSchemaPath`

- 类型：`${string}.ts`
- 默认值：`'assets/mockSchema.ts'`

给 LLM 的类型提示文件路径。默认为 `yapi-ai-mock/lib/assets/mockSchema.ts`。

如果配置了此项，请确保文件中有 `MockResponse` 和 `ResponseBodyType` 两个类型。

此选项的配置可以参考 [TypeChat Examples](https://github.com/microsoft/TypeChat/tree/main/examples)

### `mockResponseBodyType`

- 类型：`string`
- 默认值：`'any'`

给 LLM 的期望的 mock 结果的类型定义。

如果配置了 [`mockSchemaPath`](#mockschemapath)，则此配置项无效。

此配置项会与 `yapi-ai-mock/lib/assets/mockSchema.ts` 进行合并，然后将合并后的结果传输给 LLM。

格式为 typescript 类型字符串。

示例：

```ts
`{
  // response code (default: 200)
  code?: 200 | '200';
  // response message (default: success)
  message?: 'success';
  // response message data (default: null)
  // If it has currentPage field, its value is 1
  // If there is a field related to the name of the person in the data, it will be simulated as a Chinese name
  data: any;
}`;
```

### `createLanguageModel`

- 类型：

```ts
/**
   * @param axios axios 方法
   * @param success 成功回调
   * @param error 失败回调
   * @param apiEndpoint api 地址，可通过环境变量 `OPENAI_ENDPOINT` 设置，默认为 `https://api.openai.com/v1/chat/completions`
   *
   * @returns [TypeChatLanguageModel](https://github.com/microsoft/TypeChat/blob/main/src/model.ts#L10C28-L10C28)
   *
   */
function createLanguageModel: (
    axios: AxiosStatic,
    success: <T>(data: T) => Success<T>,
    error: (message: string) => Error,
    apiEndpoint: string,
  ): TypeChatLanguageModel;
```

自定义 LLM 模型。如果在[环境变量](#环境变量)中设置了 `OPENAI_API_KEY`，则此配置项无效。（因为会直接使用 openai ChatGPT 的模型）

示例：

```ts
{
  createLanguageModel: (axios, success, error, apiEndpoint) => ({
    complete: async prompt => {
      try {
        const response = await axios(apiEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          data: JSON.stringify({
            temperature: 0,
            n: 1,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        const json = response.data;
        return success((json?.data?.content as string) ?? '');
      } catch (err) {
        return error(`LLM fetch error: ${err}`);
      }
    },
  });
}
```

### `mockServer`

- 类型：

```ts
/**
 * mock 服务配置。
 */
export interface MockServerConfig {
  /**
   * mock 服务端口。默认为 `3000`。
   *
   * @default 3000
   */
  port?: number;

  /**
   * 为 http mock 服务配置 路径匹配规则，任何请求路径以 prefix 开头的都将被拦截代理。
   * 如果 prefix 以 `^` 开头，将被识别为 `RegExp`。
   * @default '/mock'
   * @example ['/mock']
   */
  prefix?: string | string[];

  /**
   * glob字符串匹配 mock数据文件
   *
   * 默认 ['mock/&#42;&#42;&#47;&#42;.&#42;']
   */
  include?: string | string[];

  /**
   * 自定义要 mock 的接口列表。
   *
   * 该配置项可以用来覆盖生成的 mock 文件，也可以用来 mock 一些没有配置 mock 文件的接口。
   *
   * @example
   *{
   *  overwrite: () => [
   *    {
   *     url: '/mock/userInfo',
   *     method: 'GET',
   * 	   body: mockjs.mock({code: 200, message: 'success', data: {nickname: '@cname'}})
   *    },
   *    ...
   *  ]
   *}
   */
  overwrite?: () => MockOptionsItem | MockOptionsItem[];
}
```

- 默认值：

```ts
{
  port: 3000,
  prefix: '/mock',
  include: ['mock/**/*.*'],
  overwrite: () => [],
}
```

mock 服务配置。

mock 服务是一个 http 服务，用于拦截请求并返回 mock 数据。

当你的项目不是 webpack 或 vite 等工具构建的 SPA 项目时，应当使用 mock 服务。

使用 `npx yam serve` 命令启动 mock 服务。

### `mockStatement`

- 类型：

```ts
function mockStatement: (mockConstruction: MockConstruction): string;

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
```

- 默认值：

```ts
`
/* hash: ${mockConstruction.hash} */
${mockConstruction.comment}
export default defineMock({
  url: '${config.mockPrefix || '/mock'}${mockConstruction.path}',
  method: '${mockConstruction.method}',
  body: mockjs.mock(
    ${mockConstruction.mockCode || '{}'}
  ),
});
`;
```

自定义生成的 mock 代码片段。

使用此方法可以自定义生成结果中的 mock 代码片段，如果不设置，则使用默认的 mock 代码片段。

### `mockImportStatement`

- 类型：

```ts
function mockImportStatement: (): string
```

- 默认值：

```ts
`
import mockjs from 'mockjs';
import { defineMock } from 'yapi-ai-mock';
`;
```

生成的文件顶部引入部分的代码片段。

### `processMockResult`

- 类型：

```ts
/**
 * @param mockResult LLM 返回的 mock 结果
 * @param interfaceInfo 接口信息
 *
 */
function processMockResult: (mockResult: any, interfaceInfo: Interface): void;
```

自定义的对 LLM 返回的 mock 结果进行处理，使其符合预期。

如果不设置，则直接使用 LLM 返回的 mock 结果。

示例：

```ts
{
  processMockResult: (mockResult, interfaceInfo) => {
    if (mockResult?.hasOwnProperty('code')) {
      mockResult.code = 200;
    }
    if (mockResult?.hasOwnProperty('message')) {
      mockResult.message = 'success';
    }
  };
}
```

## 环境变量

在 [`envPath`](#envpath) 配置项指定的环境变量文件中，可以配置以下环境变量：

| 变量名                  | 说明                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`        | OpenAI API Key，用于调用 OpenAI 的 ChatGPT 模型。                                                     |
| `OPENAI_ENDPOINT`       | OpenAI API 地址，用于调用 OpenAI 的 ChatGPT 模型。默认为 `https://api.openai.com/v1/chat/completions` |
| `OPENAI_MODEL  `        | OpenAI 模型名称（例如 `gpt-3.5-turbo` 或 `gpt-4`）                                                    |
| `OPENAI_ORGANIZATION  ` | OpenAI 组织 - 可选，默认为 `''`                                                                       |

|
| `LLM_TOKENS` | LLM 支持的 Tokens 数量，默认为 `4096` |

如果在环境变量中配置了 `OPENAI_API_KEY`，则 [`createLanguageModel`](#createlanguagemodel) 配置项无效。

## Mock 插件/中间件

yapi-ai-mock 提供了 vite 和 webpack 的 mock 插件/中间件，其他项目中可以使用 `npx yam serve` 来启动独立部署的 mock 服务。

### `viteMockPlugin`

- 类型：

```ts
function viteMockPlugin(options?: MockServerPluginOptions): any;
```

vite mock 插件。

其中 `options` 的类型 `MockServerPluginOptions` 参考 [mockServer 配置项](#mockserver)，但不支持其中的 `port` 字段。

使用示例：

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { viteMockPlugin } from 'yapi-ai-mock';
export default defineConfig({
  plugins: [..., viteMockPlugin()],
});
```

### `webpackMockMiddleware`

- 类型：

```ts
function webpackMockMiddleware(
  httpServer: Server | null,
  options?: MockServerPluginOptions,
): Promise<vite.Connect.NextHandleFunction>;
```

webpack mock 中间件。

其中 `options` 的类型 `MockServerPluginOptions` 参考 [mockServer 配置项](#mockserver)，但不支持其中的 `port` 字段。

使用示例：

```ts
// webpack.config.js
const { webpackMockMiddleware } = require('yapi-ai-mock');
module.exports = {
  devServer: {
    onBeforeSetupMiddleware: async devServer => {
      mockMiddleware = await webpackMockMiddleware(devServer.app);
      devServer.app.use(mockMiddleware);
    },
  },
};
```

## Cli 命令

| 命令                      | 说明                                  |
| ------------------------- | ------------------------------------- |
| `npx yam`                 | 生成 mock 文件                        |
| `npx yam -c=配置文件路径` | 指定配置文件并生成 mock 文件          |
| `npx yam init`            | 初始化配置文件，默认配置文件类型为 ts |
| `npx yam init -t=js`      | 指定js文件类型初始化配置文件          |
| `npx yam serve`           | 启动 mock 服务器，默认端口号为 3000   |
| `npx yam serve -p=端口号` | 指定端口启动 mock 服务器              |

## 版权

[MIT](https://github.com/qiuxchao/yapi-ai-mock/blob/main/LICENSE) ©️ [qiuxchao](https://github.com/qiuxchao)

本项目的灵感来源于这些项目：

- [TypeChat](https://github.com/microsoft/TypeChat/tree/main)
- [yapi-to-typescript](https://github.com/fjc0k/yapi-to-typescript)
- [vite-plugin-mock-dev-server](https://github.com/pengzhanbo/vite-plugin-mock-dev-server)
