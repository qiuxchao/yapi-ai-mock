import { castArray } from 'vtils';
import { Config, ServerConfig, SyntheticalConfig } from './types';

interface OutputFileList {
	[outputFilePath: string]: {
		syntheticalConfig: SyntheticalConfig;
		content: string[];
	};
}

/** 生成代码 */
export class Generator {
	/** 配置 */
	private config: ServerConfig[] = [];

	constructor(
		config: Config,
		private options: { cwd: string } = { cwd: process.cwd() }
	) {
		// config 可能是对象或数组，统一为数组
		this.config = castArray(config);
	}

	/** 前置方法，统一配置项 */
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

	/** 生成 mock 配置，返回 */
	async generate(): Promise<void> {}
	async write(outputFileList: any) {}
}
