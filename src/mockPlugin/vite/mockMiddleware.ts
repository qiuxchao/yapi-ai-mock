import { type Server } from 'node:http';
import path from 'node:path';
import { parse as urlParse } from 'node:url';
import chokidar from 'chokidar';
import fastGlob from 'fast-glob';
import { match, pathToRegexp } from 'path-to-regexp';
import { transformWithEsbuild } from 'vite';
import type { Connect, ResolvedConfig } from 'vite';
import type {
	Method,
	MockOptions,
	MockOptionsItem,
	MockServerPluginOptions,
	ResponseReq,
} from './types';
import { castArray, wait } from 'vtils';
import { mkdirSync, readFileSync, writeFileSync } from 'fs-extra';
import consola from 'consola';

const MOCK_TEMP = 'node_modules/.cache/.mock_server';

export async function mockServerMiddleware(
	httpServer: Server | null,
	config: ResolvedConfig,
	options: Required<MockServerPluginOptions>,
): Promise<Connect.NextHandleFunction> {
	const prefix = castArray(options.prefix);
	const include = castArray(options.include);
	const includePaths = await fastGlob(include, { cwd: process.cwd() });
	const modules: Record<string, MockOptions | MockOptionsItem> = Object.create(null);
	let mockList!: MockOptions;

	for (const filepath of includePaths) {
		modules[filepath] = await loadModule(filepath);
	}

	setupMockList();

	console.log('modules', modules);
	console.log('mockList', mockList);

	// 监听 mock 目录变化
	const watcher = chokidar.watch(include.splice(0)[0], {
		ignoreInitial: true,
		cwd: process.cwd(),
	});
	include.length > 0 && include.forEach(item => watcher.add(item));

	watcher.on('add', async filepath => {
		consola.info('Mock watcher add: ', filepath);
		modules[filepath] = await loadModule(filepath);
		setupMockList();
	});
	watcher.on('change', async filepath => {
		consola.info('Mock watcher change', filepath);
		modules[filepath] = await loadModule(filepath);
		setupMockList();
	});
	watcher.on('unlink', filepath => {
		consola.info('Mock watcher unlink', filepath);
		delete modules[filepath];
		setupMockList();
	});

	function setupMockList() {
		mockList = [];
		Object.keys(modules).forEach(key => {
			const handle = modules[key];
			mockList.push(...castArray(handle));
		});
		mockList = mockList.filter(mock => mock.enabled || typeof mock.enabled === 'undefined');
	}

	httpServer?.on('close', () => watcher.close());

	return async function (req, res, next) {
		// 只 mock 指定前缀的请求
		if (!prefix.some(pre => doesContextMatchUrl(pre, req.url!))) {
			return next();
		}
		const method = req.method!.toUpperCase();
		const { query, pathname } = urlParse(req.url!, true);

		// 找到需要 mock 的接口数据
		const currentMock = mockList.find(mock => {
			if (!pathname || !mock || !mock.url) return false;
			const methods: Method[] = mock.method
				? castArray(mock.method).map(method => method.toUpperCase() as Method)
				: ['GET', 'POST'];
			if (!methods.includes(req.method!.toUpperCase() as Method)) return false;
			return pathToRegexp(mock.url).test(pathname);
		});

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

async function loadModule(filepath: string): Promise<MockOptions | MockOptionsItem> {
	const ext = path.extname(filepath);
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
		return await loadESModule(tempFile);
	}
	return await loadESModule(filepath);
}

async function loadESModule(filepath: string): Promise<MockOptions | MockOptionsItem> {
	const handle = await import(`${filepath}?${Date.now()}`);
	if (handle && handle.default) return handle.default as MockOptions | MockOptionsItem;
	return Object.keys(handle || {}).map(key => handle[key]) as MockOptions;
}
