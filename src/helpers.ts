import { Config } from './types';

/**
 * 定义配置。
 *
 * @param config 配置
 */
export function defineConfig(config: Config): Config {
  return config || {};
}
