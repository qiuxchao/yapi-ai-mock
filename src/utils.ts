import axios from 'axios';
import { isObject, memoize, run } from 'vtils';
import prettier from 'prettier';
import { Interface } from './types';

/**
 * 抛出错误。
 *
 * @param msg 错误信息
 */
export function throwError(...msg: string[]): never {
	/* istanbul ignore next */
	throw new Error(msg.join(''));
}

export async function httpGet<T>(
	url: string,
	query?: Record<string, any>,
	headers?: Record<string, string>
): Promise<T> {
	const _url = new URL(url);
	if (query) {
		Object.keys(query).forEach((key) => {
			_url.searchParams.set(key, query[key]);
		});
	}
	url = _url.toString();

	const res = await axios(url, {
		method: 'GET',
		headers,
	});

	return res.data as any;
}

export async function httpPost<T>(url: string, body?: BodyInit, headers: Record<string, string> = {}): Promise<T> {
	const res = await axios(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
		data: body,
	});
	return res.data as any;
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

/** 递归删除对象中指定的key */
export const removeProperty = (obj: Record<string, any>, prop: string | string[]) => {
	if (!isObject(obj)) {
		return obj;
	}
	if (Array.isArray(prop)) {
		prop.forEach((p) => {
			delete obj[p];
		});
	} else {
		delete obj[prop];
	}
	Object.keys(obj).forEach((key) => {
		removeProperty(obj[key], prop);
	});
	return obj;
};

/** 将对象中不符合 `{['type']: string}` 并且字段名不为 `properties` | `type` | `description` 的字段删除 */
export const removeInvalidProperty = (obj: Record<string, any>) => {
	if (!isObject(obj)) {
		return obj;
	}
	Object.keys(obj).forEach((key) => {
		if (!['properties', 'type', 'description'].includes(key) && !obj[key]?.type) {
			delete obj[key];
		}
		removeInvalidProperty(obj[key]);
	});
	return obj;
};

/** 处理 mock 结果 */
export const preproccessMockResult = (mockResult: any, interfaceInfo: Interface) => {
	if (mockResult?.hasOwnProperty('code')) {
		mockResult.code = 200;
	}
	if (mockResult?.hasOwnProperty('message')) {
		mockResult.message = 'success';
	}
};
