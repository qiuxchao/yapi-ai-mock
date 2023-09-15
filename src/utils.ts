import axios from 'axios';
import { isObject, memoize, run } from 'vtils';
import prettier from 'prettier';
import { Interface } from './types';
import path from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'fs-extra';
import { transform, type Loader } from 'esbuild';

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
  headers?: Record<string, string>,
): Promise<T> {
  const _url = new URL(url);
  if (query) {
    Object.keys(query).forEach(key => {
      _url.searchParams.set(key, query[key]);
    });
  }

  const res = await axios(_url.toString(), {
    method: 'GET',
    headers,
  });

  return res.data as any;
}

export async function httpPost<T>(
  url: string,
  body?: BodyInit,
  headers: Record<string, string> = {},
): Promise<T> {
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
    printWidth: 100,
    tabWidth: 2,
    singleQuote: true,
    semi: true,
    trailingComma: 'all',
    bracketSpacing: true,
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

  const [prettierConfigErr, prettierConfig] = await run(() =>
    prettier.resolveConfig(prettierConfigPath),
  );
  if (prettierConfigErr || !prettierConfig) {
    return prettierOptions;
  }

  return {
    ...prettierOptions,
    ...prettierConfig,
    parser: 'typescript',
  };
}

export const getCachedPrettierOptions: () => Promise<prettier.Options> =
  memoize(getPrettierOptions);

/** 递归删除对象中指定的key */
export const removeProperty = (obj: Record<string, any>, prop: string | string[]) => {
  if (!isObject(obj)) {
    return obj;
  }
  if (Array.isArray(prop)) {
    prop.forEach(p => {
      delete obj[p];
    });
  } else {
    delete obj[prop];
  }
  Object.keys(obj).forEach(key => {
    removeProperty(obj[key], prop);
  });
  return obj;
};

/** 将对象中不符合 `{['type']: string}` 并且字段名不为 `properties` | `type` | `description` 的字段删除 */
export const removeInvalidProperty = (obj: Record<string, any>) => {
  if (!isObject(obj)) {
    return obj;
  }
  Object.keys(obj).forEach(key => {
    if (!['properties', 'type', 'description'].includes(key) && !obj[key]?.type) {
      delete obj[key];
    }
    removeInvalidProperty(obj[key]);
  });
  return obj;
};

/** 转换 ts | js 文件 */
export const transformWithEsbuild = async (code: string, filename: string) => {
  let loader: Loader = 'js';
  const ext = path.extname(filename).slice(1);
  if (ext === 'cjs' || ext === 'mjs') {
    loader = 'js';
  } else if (ext === 'cts' || ext === 'mts') {
    loader = 'ts';
  } else {
    loader = ext as Loader;
  }
  const result = await transform(code, {
    sourcefile: filename,
    loader,
    target: 'es2020',
    platform: 'node',
    format: 'esm',
  });
  return result;
};

/**
 * 加载ES模块
 */
export async function loadESModule<T>(filepath: string): Promise<T> {
  const handle = await import(`${filepath}?${Date.now()}`);
  return handle.default;
}

/**
 * 加载模块 ts/js
 * @param filepath 文件路径
 * @returns 文件内容
 */
export async function loadModule<T>(
  filepath: string,
  tempPath: string,
  isESM = true,
): Promise<{
  content: T;
  jsFilePath: string;
}> {
  const ext = path.extname(filepath);
  let jsFilePath = filepath;
  if (ext === '.ts' || (ext === '.js' && !isESM)) {
    const tsText = readFileSync(filepath, 'utf-8');
    const { code } = await transformWithEsbuild(tsText, filepath);
    const tempFile = path.join(process.cwd(), tempPath, filepath.replace(/\.(ts|js)$/, '.mjs'));
    const tempBasename = path.dirname(tempFile);
    mkdirSync(tempBasename, { recursive: true });
    writeFileSync(tempFile, code, 'utf8');
    jsFilePath = tempFile;
  }
  const content = await loadESModule<T>(jsFilePath);
  return {
    content,
    jsFilePath,
  };
}
