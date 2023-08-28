# yapi-ai-mock

`yapi-ai-mock` 是一个将 YAPI 接口转换为 Mock.js 配置文件的工具，可以帮助开发人员快速生成 Mock.js 配置文件，提高工作效率。基于 GPT 技术实现。

可配置的项：

- [ ] gpt 支持的最大消息字符数
- [x] YAPI 项目 token 排除的分类 id
- [x] mockjs 配置代码 目录
- [x] mockjs 配置代码 文件头部内容
- [x] mockjs 配置代码 接口前缀 默认 /mock

要实现的功能：

- 支持命令 `init` 生成配置文件，导入 `defineConfig` 生成配置文件，填充默认配置
- [x] 导出 `vite`、`webpack`、`rspack` 相关 `mock` 插件，支持在它们的 `config` 文件中配置插件

在 mock 配置文件中植入 YAPI JSON 的 md5 值，用于判断是否需要重新生成 mock 文件

生成流程：

1. 请求 YAPI 接口获得接口数据
2. 根据配置的路径找原来的 mock 文件
3. 比较 hash 值，如果不一致则重新生成 ✅
4. 生成 mock 文件

todo:

- schema MockResponse 支持自定义 ✅
- js 文件生成 ✅
- init 自命令生成配置文件 ✅
- 文档
