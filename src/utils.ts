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
