import { C as Config, a as CliHooks, b as ConfigWithHooks } from './types-31c3ce5f.js';
export { j as Category, n as CategoryConfig, k as CategoryList, c as ChangeCase, l as CommentConfig, E as ExtendedInterface, G as GptConfig, I as Interface, i as InterfaceList, M as Method, p as MockConfig, P as Project, o as ProjectConfig, R as RequestBodyType, f as RequestFormItemType, d as RequestParamType, e as RequestQueryType, h as Required, g as ResponseBodyType, q as ServerConfig, m as SharedConfig, S as SyntheticalConfig } from './types-31c3ce5f.js';
import 'path';
import 'vtils/types';

/**
 * 定义配置。
 *
 * @param config 配置
 */
declare function defineConfig(config: Config, hooks?: CliHooks): ConfigWithHooks;

export { CliHooks, Config, ConfigWithHooks, defineConfig };
