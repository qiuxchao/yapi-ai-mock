import { C as Config, a as CliHooks, b as ConfigWithHooks } from './types-12d5a0e6.js';
export { j as Category, l as CategoryConfig, c as ChangeCase, k as CommentConfig, G as GptConfig, I as Interface, i as InterfaceList, M as Method, n as MockConfig, P as Project, m as ProjectConfig, R as RequestBodyType, f as RequestFormItemType, d as RequestParamType, e as RequestQueryType, h as Required, g as ResponseBodyType, o as ServerConfig, S as SharedConfig } from './types-12d5a0e6.js';
import 'vtils/types';

/**
 * 定义配置。
 *
 * @param config 配置
 */
declare function defineConfig(config: Config, hooks?: CliHooks): ConfigWithHooks;

export { CliHooks, Config, ConfigWithHooks, defineConfig };
