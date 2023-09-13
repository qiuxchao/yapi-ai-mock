import type { Server, IncomingMessage } from 'node:http';
import { parse as urlParse } from 'node:url';
import chokidar from 'chokidar';
import fastGlob from 'fast-glob';
import { match } from 'path-to-regexp';
import type {
  Method,
  MockOptionsItem,
  MockServerPluginOptions,
  NextHandleFunction,
  ResponseReq,
} from './types';
import { castArray, isFunction, wait } from 'vtils';
import consola from 'consola';
import { loadESModule, loadModule } from '@/utils';
import { INCLUDE, MOCK_TEMP_PATH, PREFIX } from '@/constant';
import { resolve } from 'node:path';

export async function mockServerMiddleware(
  httpServer: Server | null,
  options: MockServerPluginOptions,
): Promise<NextHandleFunction> {
  const prefix = castArray(options?.prefix || PREFIX);
  const include = castArray(options?.include || INCLUDE);
  const includePaths = await fastGlob(include, { cwd: process.cwd() });
  const modules: Record<string, string> = Object.create(null);
  for (const filepath of includePaths) {
    const {
      content: { url, enabled = true },
      jsFilePath,
    } = await loadModule<MockOptionsItem>(resolve(process.cwd(), filepath), MOCK_TEMP_PATH);
    if (enabled) {
      modules[url] = jsFilePath;
    }
  }

  // 监听 mock 目录变化
  const watcher = chokidar.watch(include.splice(0)[0], {
    ignoreInitial: true,
    cwd: process.cwd(),
  });
  include.length > 0 && include.forEach(item => watcher.add(item));

  watcher.on('add', async filepath => {
    consola.info('Mock watcher add: ', filepath);
    await updateModule(filepath);
  });
  watcher.on('change', async filepath => {
    consola.info('Mock watcher change', filepath);
    await updateModule(filepath);
  });
  watcher.on('unlink', filepath => {
    consola.info('Mock watcher unlink', filepath);
    Object.keys(modules).forEach(key => {
      if (modules[key] === filepath) {
        delete modules[key];
      }
    });
  });

  // 监听 httpServer 关闭时关闭 watcher
  httpServer?.on('close', () => watcher.close());
  // 监听进程退出时关闭 watcher
  process?.on('SIGINT', () => watcher.close());

  async function updateModule(filePath: string) {
    const {
      jsFilePath,
      content: { url, enabled = true },
    } = await loadModule<MockOptionsItem>(resolve(process.cwd(), filePath), MOCK_TEMP_PATH);
    if (enabled) {
      modules[url] = jsFilePath;
    } else {
      delete modules[url];
    }
  }

  return async function (req, res, next) {
    // 只 mock 指定前缀的请求
    if (!prefix.some(pre => doesContextMatchUrl(pre, req.url!))) {
      return next();
    }

    const method = req.method!.toUpperCase() as Method;
    const { query, pathname } = urlParse(req.url!, true);

    // 是否重写了生成的mock配置
    const overwriteList = castArray(isFunction(options?.overwrite) ? options.overwrite() : []);
    const overwriteMock = overwriteList.find(m => m.url === pathname);

    if (!modules[pathname!] && !overwriteMock) return next();

    // 找到需要 mock 的接口数据
    const currentMock = overwriteMock
      ? overwriteMock
      : await loadESModule<MockOptionsItem>(modules[pathname!]);

    if (!currentMock || !castArray(currentMock.method).includes(method)) return next();

    consola.info('Mock: ', method, pathname);

    if (currentMock.delay && currentMock.delay > 0) {
      await wait(currentMock.delay);
    }

    res.statusCode = currentMock.status || 200;
    res.statusMessage = currentMock.statusText || 'OK';

    const urlMatch = match(currentMock.url, { decode: decodeURIComponent })(pathname!) || {
      params: {},
    };
    const params = urlMatch.params || {};

    (req as any).query = query;
    (req as any).params = params;

    res.setHeader('Content-Type', 'application/json');
    if (currentMock.headers) {
      const headers = currentMock.headers;
      Object.keys(headers).forEach(key => {
        res.setHeader(key, headers[key]);
      });
    }

    if (currentMock.body) {
      const body = currentMock.body;
      res.end(JSON.stringify(body));
      return;
    }

    if (currentMock.response) {
      await currentMock.response(req as IncomingMessage & ResponseReq, res, next);
      return;
    }

    res.end('');
  };
}

function doesContextMatchUrl(context: string, url: string): boolean {
  return (context.startsWith('^') && new RegExp(context).test(url)) || url.startsWith(context);
}
