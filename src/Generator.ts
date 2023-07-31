import { castArray } from 'vtils';
import { Config, ServerConfig } from './types';

/** 生成代码 */
export class Generator {
	/** 配置 */
	private config: ServerConfig[] = [];

	private disposes: Array<() => any> = [];

	constructor(
		config: Config,
		private options: { cwd: string } = { cwd: process.cwd() }
	) {
		// config 可能是对象或数组，统一为数组
		this.config = castArray(config);
	}

	async prepare(): Promise<void> {
		this.config = await Promise.all(
			// config 可能是对象或数组，统一为数组
			this.config.map(async (item) => {
				if (item.serverUrl) {
					item.serverUrl = item.serverUrl.replace(/\/+$/, '');
				}
				return item;
			})
		);
	}
	async generate(): Promise<void> {}
	async write(outputFileList: any) {}
	async destroy() {
		return Promise.all(this.disposes.map(async (dispose) => dispose()));
	}
}
