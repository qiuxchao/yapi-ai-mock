# yapi-mockjs-gpt

`yapi-mockjs-gpt` 是一个将 YAPI 接口转换为 Mock.js 配置文件的工具，可以帮助开发人员快速生成 Mock.js 配置文件，提高工作效率。基于 GPT 技术实现。

可配置的项：

- [ ] gpt 接口（支持配置到 env 里）
- [ ] gpt 请求头 请求体
- [ ] gpt 支持的最大消息字符数
- [ ] YAPI 域名
- [ ] YAPI 项目 token 排除的分类 id
- [ ] YAPI 生成模式 全量生成 or 只生成未完成的接口
- [ ] mockjs 配置代码 目录
- [ ] mockjs 配置代码 文件名后缀
- [ ] mockjs 配置代码 文件头部内容
- [ ] mockjs 配置代码 文件尾部内容
- [ ] mockjs 配置代码 接口前缀 默认 /mock

支持命令 `init` 生成配置文件，导入 `defineConfig` 生成配置文件，填充默认配置

在 mock 配置文件中植入 YAPI JSON 的 md5 值，用于判断是否需要重新生成 mock 文件

生成流程：

1. 请求 YAPI 接口获得接口数据
2. 根据配置的路径找原来的 mock 文件
3. 比较 md5 值，如果不一致则重新生成
4. 生成 mock 文件
