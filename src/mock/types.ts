import type http from 'node:http';

export interface MockServerPluginOptions {
  /**
   * 为 http mock 服务配置 路径匹配规则，任何请求路径以 prefix 开头的都将被拦截代理。
   * 如果 prefix 以 `^` 开头，将被识别为 `RegExp`。
   * @default '/mock'
   * @example ['/mock']
   */
  prefix?: string | string[];

  /**
   * glob字符串匹配 mock数据文件
   *
   * 默认 ['mock/&#42;&#42;&#47;&#42;.&#42;']
   */
  include?: string | string[];

  /**
   * 自定义要 mock 的接口列表。
   * 
   * 该配置项可以用来覆盖生成的 mock 文件，也可以用来 mock 一些没有配置 mock 文件的接口。
   *
   * @example
   *{
   *  overwrite: () => [
   *    {
   *     url: '/mock/userInfo',
   *     method: 'GET',
   * 	   body: mockjs.mock({code: 200, message: 'success', data: {nickname: '@cname'}})
   *    },
   *    ...
   *  ]
   *}
   */
  overwrite?: () => MockOptionsItem | MockOptionsItem[];
}

export interface IncomingMessage extends http.IncomingMessage {
  originalUrl?: http.IncomingMessage['url'] | undefined;
}

export type NextFunction = (err?: any) => void;

export type NextHandleFunction = (
  req: IncomingMessage,
  res: http.ServerResponse,
  next: NextFunction,
) => void;

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'TRACE' | 'OPTIONS';

type ResponseBody = Record<string, any> | any[] | string | number | null;

export interface ResponseReq {
  /**
   * 请求地址中位于 `?` 后面的 queryString，已解析为 json
   */
  query: Record<string, any>;
  /**
   * 请求体中 body 数据
   */
  body: Record<string, any>;
  /**
   * 请求地址中，/api/id/:id 解析后的 params 参数
   */
  params: Record<string, any>;

  /**
   * 请求 中的 headers
   */
  headers: Record<string, any>;
}

type Headers = Record<string, any>;

export interface MockOptionsItem {
  /**
   * 需要做 mock 的接口地址，
   *
   * @example `/mock/login`
   */
  url: string;

  /**
   * 该接口支持的请求方法。
   */
  method: Method | Method[];

  /**
   * 是否启动对该接口的 mock，在多数场景下，我们进需要对部分接口进行 mock，
   * 而不是对所有配置了 mock 的请求进行全量 mock，所以是否能够配置是否启用很重要
   *
   * @default true
   */
  enabled?: boolean;

  /**
   * 配置响应体 header
   *
   * @default {'Content-Type':'application/json'}
   */
  headers?: Headers;

  /**
   * 配置 响应头状态码
   *
   * @default 200
   */
  status?: number;

  /**
   * 配置响应头状态文本
   *
   * @default 'OK'
   */
  statusText?: string;

  /**
   * 配置响应延迟时间, 单位： `ms`
   *
   * @default 0
   */
  delay?: number;

  /**
   * 配置响应体数据内容
   *
   * @default {}
   */
  body?: ResponseBody;

  /**
   * 如果需要设置复杂的响应内容，可以使用 response 方法，
   * 该方法是一个 middleware，你可以在这里拿到 http 请求的 req、res等信息，
   * 然后通过 res.write() | res.end() 返回响应数据， 否则执行 next() 方法。
   *
   * 在 req 中，还可以拿到 query、params、body等已解析的请求信息
   */
  response?: (
    req: IncomingMessage & ResponseReq,
    res: http.ServerResponse<http.IncomingMessage>,
    next: NextFunction,
  ) => void | Promise<void>;
}
