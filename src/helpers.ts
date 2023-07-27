import { CliHooks, Config, ConfigWithHooks } from './types';

/**
 * 定义配置。
 *
 * @param config 配置
 */
export function defineConfig(config: Config, hooks?: CliHooks): ConfigWithHooks {
	if (hooks) {
		Object.defineProperty(config, 'hooks', {
			value: hooks,
			configurable: false,
			enumerable: false,
			writable: false,
		});
	}
	return config;
}
