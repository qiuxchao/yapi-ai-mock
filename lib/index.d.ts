import { C as Config, a as CliHooks, b as ConfigWithHooks } from './types-5d5ddce2.js';
export { j as Category, m as CategoryConfig, c as ChangeCase, k as CommentConfig, G as GptConfig, I as Interface, i as InterfaceList, M as Method, o as MockConfig, P as Project, n as ProjectConfig, R as RequestBodyType, f as RequestFormItemType, d as RequestParamType, e as RequestQueryType, h as Required, g as ResponseBodyType, p as ServerConfig, l as SharedConfig, S as SyntheticalConfig } from './types-5d5ddce2.js';
import 'vtils/types';

/**
 * 定义配置。
 *
 * @param config 配置
 */
declare function defineConfig(config: Config, hooks?: CliHooks): ConfigWithHooks;

export { CliHooks, Config, ConfigWithHooks, defineConfig };
