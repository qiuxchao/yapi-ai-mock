export type OmitStrict<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type LiteralUnion<LiteralType, BaseType extends any> = LiteralType | (BaseType & { _?: never });
export type OneOrMore<T> = T | T[];

export interface ChangeCase {
	/**
	 * @example
	 * changeCase.camelCase('test string') // => 'testString'
	 */
	camelCase: (value: string) => string;
	/**
	 * @example
	 * changeCase.constantCase('test string') // => 'TEST_STRING'
	 */
	constantCase: (value: string) => string;
	/**
	 * @example
	 * changeCase.dotCase('test string') // => 'test.string'
	 */
	dotCase: (value: string) => string;
	/**
	 * @example
	 * changeCase.headerCase('test string') // => 'Test-String'
	 */
	headerCase: (value: string) => string;
	/**
	 * @example
	 * changeCase.lowerCase('TEST STRING') // => 'test string'
	 */
	lowerCase: (value: string) => string;
	/**
	 * @example
	 * changeCase.lowerCaseFirst('TEST') // => 'tEST'
	 */
	lowerCaseFirst: (value: string) => string;
	/**
	 * @example
	 * changeCase.paramCase('test string') // => 'test-string'
	 */
	paramCase: (value: string) => string;
	/**
	 * @example
	 * changeCase.pascalCase('test string') // => 'TestString'
	 */
	pascalCase: (value: string) => string;
	/**
	 * @example
	 * changeCase.pathCase('test string') // => 'test/string'
	 */
	pathCase: (value: string) => string;
	/**
	 * @example
	 * changeCase.sentenceCase('testString') // => 'Test string'
	 */
	sentenceCase: (value: string) => string;
	/**
	 * @example
	 * changeCase.snakeCase('test string') // => 'test_string'
	 */
	snakeCase: (value: string) => string;
	/**
	 * @example
	 * changeCase.swapCase('Test String') // => 'tEST sTRING'
	 */
	swapCase: (value: string) => string;
	/**
	 * @example
	 * changeCase.titleCase('a simple test') // => 'A Simple Test'
	 */
	titleCase: (value: string) => string;
	/**
	 * @example
	 * changeCase.upperCase('test string') // => 'TEST STRING'
	 */
	upperCase: (value: string) => string;
	/**
	 * @example
	 * changeCase.upperCaseFirst('test') // => 'Test'
	 */
	upperCaseFirst: (value: string) => string;
}

/** 请求方式 */
export enum Method {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	DELETE = 'DELETE',
	HEAD = 'HEAD',
	OPTIONS = 'OPTIONS',
	PATCH = 'PATCH',
}

/** 请求数据类型 */
export enum RequestBodyType {
	/** 查询字符串 */
	query = 'query',
	/** 表单 */
	form = 'form',
	/** JSON */
	json = 'json',
	/** 纯文本 */
	text = 'text',
	/** 文件 */
	file = 'file',
	/** 原始数据 */
	raw = 'raw',
	/** 无请求数据 */
	none = 'none',
}

/** 请求路径参数类型 */
export enum RequestParamType {
	/** 字符串 */
	string = 'string',
	/** 数字 */
	number = 'number',
}

/** 请求查询参数类型 */
export enum RequestQueryType {
	/** 字符串 */
	string = 'string',
	/** 数字 */
	number = 'number',
}

/** 请求表单条目类型 */
export enum RequestFormItemType {
	/** 纯文本 */
	text = 'text',
	/** 文件 */
	file = 'file',
}

/** 返回数据类型 */
export enum ResponseBodyType {
	/** JSON */
	json = 'json',
	/** 纯文本 */
	text = 'text',
	/** XML */
	xml = 'xml',
	/** 原始数据 */
	raw = 'raw',

	// yapi 实际上返回的是 json，有另外的字段指示其是否是 json schema
	/** JSON Schema */
	// jsonSchema = 'json-schema',
}

/** 是否必需 */
export enum Required {
	/** 不必需 */
	false = '0',
	/** 必需 */
	true = '1',
}

/** 接口定义 */
export interface Interface {
	/** 接口 ID */
	_id: number;
	/** 所属分类信息（自行实现） */
	_category: OmitStrict<Category, 'list'>;
	/** 所属项目信息（自行实现） */
	_project: Project;
	/** 接口在 YApi 上的地址（自行实现） */
	_url: string;
	/** 接口名称 */
	title: string;
	/** 状态 */
	status: LiteralUnion<'done' | 'undone', string>;
	/** 接口备注 */
	markdown: string;
	/** 请求路径 */
	path: string;
	/** 请求方式，HEAD、OPTIONS 处理与 GET 相似，其余处理与 POST 相似 */
	method: Method;
	/** 所属项目 id */
	project_id: number;
	/** 所属分类 id */
	catid: number;
	/** 标签列表 */
	tag: string[];
	/** 请求头 */
	req_headers: Array<{
		/** 名称 */
		name: string;
		/** 值 */
		value: string;
		/** 备注 */
		desc: string;
		/** 示例 */
		example: string;
		/** 是否必需 */
		required: Required;
	}>;
	/** 路径参数 */
	req_params: Array<{
		/** 名称 */
		name: string;
		/** 备注 */
		desc: string;
		/** 示例 */
		example: string;
		/** 类型（YApi-X） */
		type?: RequestParamType;
	}>;
	/** 仅 GET：请求串 */
	req_query: Array<{
		/** 名称 */
		name: string;
		/** 备注 */
		desc: string;
		/** 示例 */
		example: string;
		/** 是否必需 */
		required: Required;
		/** 类型（YApi-X） */
		type?: RequestQueryType;
	}>;
	/** 仅 POST：请求内容类型。为 text, file, raw 时不必特殊处理。 */
	req_body_type: RequestBodyType;
	/** `req_body_type = json` 时是否为 json schema */
	req_body_is_json_schema: boolean;
	/** `req_body_type = form` 时的请求内容 */
	req_body_form: Array<{
		/** 名称 */
		name: string;
		/** 类型 */
		type: RequestFormItemType;
		/** 备注 */
		desc: string;
		/** 示例 */
		example: string;
		/** 是否必需 */
		required: Required;
	}>;
	/** `req_body_type = json` 时的请求内容 */
	req_body_other: string;
	/** 返回数据类型 */
	res_body_type: ResponseBodyType;
	/** `res_body_type = json` 时是否为 json schema */
	res_body_is_json_schema: boolean;
	/** 返回数据 */
	res_body: string;
	/** 创建时间（unix时间戳） */
	add_time: number;
	/** 更新时间（unix时间戳） */
	up_time: number;
	/** 创建人 ID */
	uid: number;
	[key: string]: any;
}

/** 接口列表 */
export type InterfaceList = Interface[];

/** 分类信息 */
export interface Category {
	/** ID */
	_id: number;
	/** 分类在 YApi 上的地址（自行实现） */
	_url: string;
	/** 分类名称 */
	name: string;
	/** 分类备注 */
	desc: string;
	/** 分类接口列表 */
	list: InterfaceList;
	/** 创建时间（unix时间戳） */
	add_time: number;
	/** 更新时间（unix时间戳） */
	up_time: number;
}

/** 项目信息 */
export interface Project {
	/** ID */
	_id: number;
	/** 项目在 YApi 上的地址（自行实现） */
	_url: string;
	/** 名称 */
	name: string;
	/** 描述 */
	desc: string;
	/** 基本路径 */
	basepath: string;
	/** 标签 */
	tag: string[];
	/** 环境配置 */
	env: Array<{
		/** 环境名称 */
		name: string;
		/** 环境域名 */
		domain: string;
	}>;
}

/** 支持生成注释的相关配置 */
export interface CommentConfig {
	/**
	 * 是否开启该项功能。
	 *
	 * @default true
	 */
	enabled?: boolean;

	/**
	 * 是否有标题。
	 *
	 * @default true
	 */
	title?: boolean;

	/**
	 * 是否有分类名称。
	 *
	 * @default true
	 */
	category?: boolean;

	/**
	 * 是否有标签。
	 *
	 * @default true
	 */
	tag?: boolean;

	/**
	 * 是否有请求头。
	 *
	 * @default true
	 */
	requestHeader?: boolean;

	/**
	 * 是否有更新时间。
	 *
	 * @default true
	 */
	updateTime?: boolean;

	/**
	 * 是否为标题、分类名称添加链接。
	 *
	 * @default true
	 */
	link?: boolean;
}

/**
 * 共享的配置。
 */
export interface SharedConfig {
	/**
	 * 要生成的目标代码类型。
	 * 默认为 `javascript`。
	 *
	 * @default 'javascript'
	 */
	target?: 'javascript' | 'typescript';

	/**
	 * 输出文件路径。
	 *
	 * 可以是 `相对路径` 或 `绝对路径`。
	 *
	 * @example 'src/api/index.ts'
	 */
	outputFilePath?: string | ((interfaceInfo: Interface, changeCase: ChangeCase) => string);

	/**
	 * 支持生成注释的相关配置。
	 */
	comment?: CommentConfig;
}

/**
 * 分类的配置。
 */
export interface CategoryConfig extends SharedConfig {
	/**
	 * 分类 ID，可以设置多个。设为 `0` 时表示全部分类。
	 *
	 * 如果需要获取全部分类，同时排除指定分类，可以这样：`[0, -20, -21]`，分类 ID 前面的负号表示排除。
	 *
	 * 获取方式：打开项目 --> 点开分类 --> 复制浏览器地址栏 `/api/cat_` 后面的数字。
	 *
	 * @example 20
	 */
	id: number | number[];
}

/**
 * 项目的配置。
 */
export interface ProjectConfig extends SharedConfig {
	/**
	 * 项目的唯一标识。支持多个项目。
	 *
	 * 获取方式：打开项目 --> `设置` --> `token配置` --> 复制 token。
	 *
	 * @example 'e02a47135259d0c1973a9ff8xsbb30685d64abc7df39edaa1ac6b6a792a647d'
	 */
	token: string | string[];

	/**
	 * 分类列表。
	 */
	categories: CategoryConfig[];
}

/**
 * GPT 配置
 */
export interface GptConfig {
	/**
	 * 是否优先从 `env` 中获取 gpt 服务地址。此选项会从 `process.env` 中的 `GPT_URL` 字段获取服务地址。
	 */
	formEnv?: boolean;

	/**
	 * gpt 服务地址。开启了 `fromEnv` 选项后，此选项可以不配置。
	 */
	serverUr?: string;

	/**
	 * gpt 支持的最大消息字符数
	 * @default 4096
	 */
	maxLength?: number;

	/**
	 * gpt 请求头
	 */
	headers?: Record<string, string>;

	/**
	 * gpt 响应字段路径
	 * 如果接口响应的结果是 `JSON` 对象，
	 * 且我们想要的数据在该对象下，
	 * 那我们就可将 `dataKey` 设为我们想要的数据对应的键。
	 *
	 * 比如该对象为 `{ code: 200, msg: 'success', data: { content: 100 } }`，
	 * 我们想要的数据为 `100`，
	 * 则我们可将 `dataKey` 设为 `['data', 'content']`。
	 *
	 * @example 'data'
	 * @example ['data', 'content']
	 * @default ['data', 'content']
	 */
	dataKey?: OneOrMore<string>;
}

/**
 * Mock 配置
 */
export interface MockConfig {
	/**
	 * mock 目录路径。默认为 `mock`。
	 *
	 * 可以是 `相对路径` 或 `绝对路径`。
	 *
	 * @example 'mock'
	 * @example 'src/mock'
	 *
	 * @default 'mock'
	 */
	mockDir?: string;

	/**
	 * 输出文件路径。
	 *
	 * 可以是 `相对路径` 或 `绝对路径`。
	 *
	 * @example 'src/api/index.ts'
	 */
	outputFilePath?: string | ((interfaceInfo: Interface, changeCase: ChangeCase) => string);
}

export interface Config extends SharedConfig {
	/**
	 * 是否优先从 `env` 中获取服务地址。此选项会从 `process.env` 中的 `YAPI_SERVER_URL` 字段获取服务地址。
	 */
	fromEnv?: boolean;

	/**
	 * yapi 服务地址。开启了 `fromEnv` 选项后，此选项可以不配置。
	 *
	 * @example 'http://yapi.foo.bar'
	 */
	serverUrl?: string;

	/**
	 * 项目列表
	 */
	projects: ProjectConfig[];

	/**
	 * gpt 配置
	 */
	gpt: GptConfig;

	/**
	 * mock 配置
	 */
}

export const defineConfig = (config: Config): Config => config;
