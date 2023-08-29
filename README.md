# yapi-ai-mock

<br>
<br>
<p align="center">
  <b>使用 AI 技术，将 YAPI 接口文档生成为本地的 Mock 文件。</b>
</p>

<p align="center">对 Vite 和 Webpack 提供 Mock 插件/中间件，其他项目可使用独立部署的 Mock 服务。</p>

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

初始化配置文件：

```bash
npx yam init
```

生成配置文件后，在配置文件中填写 YAPI 服务器地址、项目 token、分类 id，以及其他配置项。

生成 mock 文件：

```bash
npx yam
```

在 Vite 中使用：

```js
// vite.config.js
import { defineConfig } from 'vite';
import { viteMockPlugin } from 'yapi-ai-mock';
export default defineConfig({
	plugins: [..., viteMockPlugin()],
});
```

在 Webpack 中使用：

```js
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

在其他项目中使用，直接启动 mock 服务器：

```bash
npx yam serve
```

## 配置

## Cli 命令
