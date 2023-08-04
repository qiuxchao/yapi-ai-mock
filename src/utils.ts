import nodeFetch from 'node-fetch';
import { memoize, run } from 'vtils';
import prettier from 'prettier';

/**
 * 抛出错误。
 *
 * @param msg 错误信息
 */
export function throwError(...msg: string[]): never {
	/* istanbul ignore next */
	throw new Error(msg.join(''));
}

export async function httpGet<T>(url: string, query?: Record<string, any>): Promise<T> {
	const _url = new URL(url);
	if (query) {
		Object.keys(query).forEach((key) => {
			_url.searchParams.set(key, query[key]);
		});
	}
	url = _url.toString();

	const res = await nodeFetch(url, {
		method: 'GET',
	});

	return res.json() as any;
}

/** 排序 */
export function sortByWeights<T extends { weights: number[] }>(list: T[]): T[] {
	list.sort((a, b) => {
		const x = a.weights.length > b.weights.length ? b : a;
		const minLen = Math.min(a.weights.length, b.weights.length);
		const maxLen = Math.max(a.weights.length, b.weights.length);
		x.weights.push(...new Array(maxLen - minLen).fill(0));
		const w = a.weights.reduce((w, _, i) => {
			if (w === 0) {
				w = a.weights[i] - b.weights[i];
			}
			return w;
		}, 0);
		return w;
	});
	return list;
}

export async function getPrettierOptions(): Promise<prettier.Options> {
	const prettierOptions: prettier.Options = {
		parser: 'typescript',
		printWidth: 120,
		tabWidth: 2,
		singleQuote: true,
		semi: false,
		trailingComma: 'all',
		bracketSpacing: false,
		endOfLine: 'lf',
	};

	// 测试时跳过本地配置的解析
	if (process.env.JEST_WORKER_ID) {
		return prettierOptions;
	}

	const [prettierConfigPathErr, prettierConfigPath] = await run(() => prettier.resolveConfigFile());
	if (prettierConfigPathErr || !prettierConfigPath) {
		return prettierOptions;
	}

	const [prettierConfigErr, prettierConfig] = await run(() => prettier.resolveConfig(prettierConfigPath));
	if (prettierConfigErr || !prettierConfig) {
		return prettierOptions;
	}

	return {
		...prettierOptions,
		...prettierConfig,
		parser: 'typescript',
	};
}

export const getCachedPrettierOptions: () => Promise<prettier.Options> = memoize(getPrettierOptions);
