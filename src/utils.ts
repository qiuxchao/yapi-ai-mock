import nodeFetch from 'node-fetch';

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
