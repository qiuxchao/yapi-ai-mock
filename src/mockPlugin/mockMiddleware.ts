import { type Server } from 'node:http';
import path from 'node:path';
import { parse as urlParse } from 'node:url';
import chokidar from 'chokidar';
import fastGlob from 'fast-glob';
import { match } from 'path-to-regexp';
import { transformWithEsbuild } from 'vite';
import type { Connect } from 'vite';
import type { MockOptionsItem, MockServerPluginOptions, ResponseReq } from './types';
import { castArray, wait } from 'vtils';
import { mkdirSync, readFileSync, writeFileSync } from 'fs-extra';
import consola from 'consola';

const MOCK_TEMP = 'node_modules/.cache/.mock_server';

export async function mockServerMiddleware(
	httpServer: Server | null,
	options: Required<MockServerPluginOptions>,
): Promise<Connect.NextHandleFunction> {
	const prefix = castArray(options.prefix);
	const include = castArray(options.include);
	const includePaths = await fastGlob(include, { cwd: process.cwd() });
	const modules: Record<string, string> = Object.create(null);
	for (const filepath of includePaths) {
		const { enabled, mockPath, jsFilePath } = await loadModule(filepath);
		if (enabled) {
			modules[mockPath] = jsFilePath;
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
	process?.on('SIGINT', () => {
		watcher.close();
	});

	async function updateModule(filePath: string) {
		const { mockPath, jsFilePath, enabled } = await loadModule(filePath);
		if (enabled) {
			modules[mockPath] = jsFilePath;
		} else {
			delete modules[mockPath];
		}
	}

	return async function (req, res, next) {
		// 只 mock 指定前缀的请求
		if (!prefix.some(pre => doesContextMatchUrl(pre, req.url!))) {
			return next();
		}
		const method = req.method!.toUpperCase();
		const { query, pathname } = urlParse(req.url!, true);

		if (!modules[pathname!]) return next();

		// 找到需要 mock 的接口数据
		const currentMock = await loadESModule(modules[pathname!]);

		if (!currentMock) return next();

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
			await currentMock.response(req as Connect.IncomingMessage & ResponseReq, res, next);
			return;
		}

		res.end('');
	};
}

function doesContextMatchUrl(context: string, url: string): boolean {
	return (context.startsWith('^') && new RegExp(context).test(url)) || url.startsWith(context);
}

async function loadModule(
	filepath: string,
): Promise<{ mockPath: string; jsFilePath: string; enabled: boolean }> {
	const ext = path.extname(filepath);
	let jsFilePath = filepath;
	if (ext === '.ts') {
		const tsText = readFileSync(filepath, 'utf-8');
		const { code } = await transformWithEsbuild(tsText, filepath, {
			target: 'es2020',
			platform: 'node',
			format: 'esm',
		});
		const tempFile = path.join(process.cwd(), MOCK_TEMP, filepath.replace(/\.ts$/, '.mjs'));
		const tempBasename = path.dirname(tempFile);
		mkdirSync(tempBasename, { recursive: true });
		writeFileSync(tempFile, code, 'utf8');
		jsFilePath = tempFile;
	}
	const { url, enabled = true } = await loadESModule(jsFilePath);
	return { mockPath: url, jsFilePath, enabled };
}

async function loadESModule(filepath: string): Promise<MockOptionsItem> {
	const handle = await import(`${filepath}?${Date.now()}`);
	return handle.default as MockOptionsItem;
}
