import nodeFetch, { BodyInit } from 'node-fetch';
import { indent, isObject, memoize, run } from 'vtils';
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

	const res = await nodeFetch(url, {
		method: 'GET',
		headers,
	});

	return res.json() as any;
}

export async function httpPost<T>(url: string, body?: BodyInit, headers: Record<string, string> = {}): Promise<T> {
	const res = await nodeFetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
		body,
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

/** get GPT Prompt */
export const getMockPrompt = (input: string) => indent`
Example:
Input: '{"1384":{"type":"object","properties":{"code":{"type":"integer"},"message":{"type":"string"},"data":{"type":"array","items":{"type":"object","properties":{"itemCategoryId":{"type":"number","description":"商品类目 ID"},"itemCateGoryName":{"type":"string","description":"商品类目名称"}},"required":["itemCategoryId","itemCateGoryName"]}}},"$schema":"http://json-schema.org/draft-04/schema#","description":""}}'
Output: '{"1384":{"code":200,"message":"success","data|10-20":[{"itemCategoryId|1-100":1,"itemCateGoryName":"@ctitle(2, 5)"}]}}'
Input: '{"1520":{"type":"object","properties":{"code":{"type":"integer"},"message":{"type":"string"},"data":{"type":"object","properties":{"contactsName":{"type":"string","description":"联系人名称"},"contactsWxCode":{"type":"string","description":"联系人微信"},"contactsWxImg":{"type":"string","description":"联系人二维码"}},"description":"成功返回结果"}},"$schema":"http://json-schema.org/draft-04/schema#","description":""},"1356":{"type":"object","properties":{"code":{"type":"integer"},"message":{"type":"string"},"data":{"type":"array","items":{"type":"object","properties":{"title":{"type":"string","description":"需求名称"},"createTime":{"type":"object","properties":{},"description":"奖励发放时间"}}},"description":"成功返回结果"}},"description":""}}'
Output: '{"1520":{"code":200,"message":"success","data":{"contactsName":"@cname()","contactsWxCode":"@word(5, 10)","contactsWxImg":"@image(\\"200x200\\", \\"#ccc\\", \\"#fff\\", \\"wxQrCode\\")"}},"1356":{"code":200,"message":"success","data|10-20":[{"title":"@ctitle(5, 10)","createTime":"@datetime"}]}}'

Prompt:
Input: '{"1468":{"type":"object","properties":{"code":{"type":"integer"},"message":{"type":"string"},"data":{"type":"object","properties":{"list":{"type":"array","items":{"type":"object","properties":{"id":{"type":"number","description":"主键id"},"orderNo":{"type":"string","description":"订单编号"},"parentOrderNo":{"type":"string","description":"父订单编号"},"msgContent":{"type":"string","description":"消息内容"},"itemTitle":{"type":"string","description":"商品标题"},"consigneeName":{"type":"string","description":"收货联系人"},"consigneeMobile":{"type":"string","description":"收货联系手机号"},"consigneeAddress":{"type":"string","description":"收货人地址"},"groupLeaderName":{"type":"string","description":"团长昵称"},"groupLeaderWxGroupRelation":{"type":"string","description":"团长关联群聊"},"companyName":{"type":"string","description":"供应商名称"},"supplierWxGroupRelation":{"type":"string","description":"供应商关联群聊"},"operatorName":{"type":"string","description":"操作人姓名"},"processingStatus":{"type":"number","description":"处理状态(1:未处理,2:已处理)"},"createTime":{"type":"string","description":"创建时间"},"updateTime":{"type":"string","description":"处理时间"}}}},"endPage":{"type":"boolean"},"totalCount":{"type":"number"},"currentPage":{"type":"number"}},"required":["list","currentPage","totalCount","endPage"]}},"description":""}}'
Output: '{"1468":{"code":200,"message":"success","data":{"list|10-20":[{"id|1-100":1,"orderNo":"@word(10, 20)","parentOrderNo":"@word(10, 20)","msgContent":"@csentence(10, 20)","itemTitle":"@ctitle(5, 10)","consigneeName":"@cname()","consigneeMobile":"@integer(10000000000, 19999999999)","consigneeAddress":"@county(true)","groupLeaderName":"@cname()","groupLeaderWxGroupRelation":"@word(5, 10)","companyName":"@ctitle(5, 10)","supplierWxGroupRelation":"@word(5, 10)","operatorName":"@cname()","processingStatus|1-2":1,"createTime":"@datetime","updateTime":"@datetime"}],"endPage":true,"totalCount|100-200":100,"currentPage":1}}}'
Input: ${input}
Output: 
`;

/** get GPT JSON String fix Prompt */
export const getJSONFixPrompt = (originJSONString: string, error: string) => indent`
Example:
Origin JSON String:
{"1384":{"code":200,"message":"success","data|10-20":[{"itemCategoryId|1-100":1,"itemCateGoryName":"@ctitle(2, 5)"}]}}}
Parsed Error Message:
SyntaxError: Unexpected non-whitespace character after JSON at position 118
Revised JSON String:
{"1384":{"code":200,"message":"success","data|10-20":[{"itemCategoryId|1-100":1,"itemCateGoryName":"@ctitle(2, 5)"}]}}

Prompt:
Origin JSON String:
${originJSONString}
Parsed Error Message:
${error}
Revised JSON String:
`;

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
