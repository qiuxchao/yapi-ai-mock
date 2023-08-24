import {
	castArray,
	dedent,
	isEmpty,
	memoize,
	noop,
	omit,
	uniq,
	isFunction,
	indent,
	cloneDeepFast,
} from 'vtils';
import * as changeCase from 'change-case';
import {
	Category,
	CategoryConfig,
	CategoryList,
	CommentConfig,
	Config,
	ExtendedInterface,
	Interface,
	MockConstruction,
	Project,
	ProjectConfig,
	ServerConfig,
	SyntheticalConfig,
	InterfaceList,
} from './types';
import {
	getCachedPrettierOptions,
	httpGet,
	throwError,
	removeInvalidProperty,
	proccessMockResult,
} from './utils';
import * as fs from 'fs-extra';
import path from 'path';
import dayjs from 'dayjs';
import prettier from 'prettier';
import { exec } from 'child_process';
import chat from './chat';
import consola from 'consola';
import { Ora } from 'ora';
import { SHA256 } from 'crypto-js';
import { OPENAI_MAX_TOKENS } from './constant';

interface OutputFileList {
	[outputFilePath: string]: {
		syntheticalConfig: SyntheticalConfig;
		content: string[];
	};
}

interface SyntheticalInterface {
	syntheticalConfig: SyntheticalConfig;
	interfaceInfo: Interface;
}

/** 生成代码 */
export class Generator {
	/** 配置 */
	private config: Omit<Config, 'yapi'> = {};
	/** yapi 服务配置 */
	private serverConfig: ServerConfig[] = [];
	/** 总任务数 */
	private total: number = 0;
	/** 完成的任务数 */
	private completed: number = 0;
	/** 接口列表 */
	private interfaceList: SyntheticalInterface[] = [];

	constructor(
		config: Config,
		private options: { cwd: string } = { cwd: process.cwd() },
	) {
		// server config 可能是对象或数组，统一为数组
		this.serverConfig = castArray(config.yapi);
		this.config = omit(config, ['yapi']);
	}

	/** 前置方法，统一配置项 */
	async prepare(): Promise<void> {
		this.serverConfig = await Promise.all(
			// config 可能是对象或数组，统一为数组
			this.serverConfig.map(async item => {
				const serverUrl = item.serverUrl?.replace(/\/+$/, '');
				if (!serverUrl) {
					throwError('未配置 yapi 服务地址，请通过配置文件中的 serverUrl 字段配置');
				}
				item.serverUrl = serverUrl;
				return item;
			}),
		);
	}

	/** 拉取并解析接口数据 */
	async resolve(): Promise<number> {
		await Promise.all(
			this.serverConfig.map(async (serverConfig, serverIndex) => {
				const projects = serverConfig.projects.reduce<ProjectConfig[]>((projects, project) => {
					projects.push(
						...castArray(project.token).map(token => ({
							...project,
							token,
						})),
					);
					return projects;
				}, []);
				return Promise.all(
					projects.map(async (projectConfig, projectIndex) => {
						const projectInfo = await this.fetchProjectInfo({
							...serverConfig,
							...projectConfig,
						});
						await Promise.all(
							projectConfig.categories.map(async (categoryConfig, categoryIndex) => {
								// 分类处理
								// 数组化
								let categoryIds = castArray(categoryConfig.id);
								// 全部分类
								if (categoryIds.includes(0)) {
									categoryIds.push(...projectInfo.cats.map(cat => cat._id));
								}
								// 唯一化
								categoryIds = uniq(categoryIds);
								// 去掉被排除的分类
								const excludedCategoryIds = categoryIds.filter(id => id < 0).map(Math.abs);
								categoryIds = categoryIds.filter(id => !excludedCategoryIds.includes(Math.abs(id)));
								// 删除不存在的分类
								categoryIds = categoryIds.filter(
									id => !!projectInfo.cats.find(cat => cat._id === id),
								);
								// 顺序化
								categoryIds = categoryIds.sort();

								await Promise.all(
									categoryIds.map<Promise<void>>(async (id, categoryIndex2) => {
										categoryConfig = {
											...categoryConfig,
											id,
										};
										const syntheticalConfig: SyntheticalConfig = {
											...serverConfig,
											...projectConfig,
											...categoryConfig,
										};
										syntheticalConfig.target = syntheticalConfig.target || 'typescript';

										// 接口列表
										let interfaceList = await this.fetchInterfaceList(syntheticalConfig);

										interfaceList = interfaceList
											.map(interfaceInfo => {
												// 实现 _project 字段
												interfaceInfo._project = omit(projectInfo, ['cats']);
												// 实现 _outputFilePath 字段
												const [_, projectName, categoryName, ...interfacePath] =
													interfaceInfo.path.split('/');
												interfaceInfo._outputFilePath = path.resolve(
													this.options.cwd,
													`${this.config?.mockDir || 'mock'}/${changeCase.camelCase(
														`${projectName}-${categoryName}`,
													)}${
														interfacePath.length
															? `/${changeCase.camelCase(interfacePath.join(''))}`
															: ''
													}.ts`,
												);
												// 对接口返回数据进行解析处理，如果无法解析，则忽略该接口
												try {
													const parsedResBody = JSON.parse(interfaceInfo.res_body);
													// 过滤掉 `res_body` 中的 `$schema` 和 `required` 字段
													removeInvalidProperty(parsedResBody);
													interfaceInfo._parsedResBody = parsedResBody;
												} catch (e) {
													consola.warn(
														`接口 ${interfaceInfo.path} 的 res_body 不是合法的 JSON 字符串，已忽略`,
													);
													return false;
												}
												// 根据 res_body 生成 hash，用来防止重新生成
												interfaceInfo._hash = SHA256(interfaceInfo.res_body).toString();
												// 判断是否需要重新生成
												if (fs.existsSync(interfaceInfo._outputFilePath)) {
													const content = fs.readFileSync(interfaceInfo._outputFilePath, 'utf8');
													const match = content.match(/\/\* hash: ([^\*]+) \*\//);
													if (match && match[1] === interfaceInfo._hash) {
														return false;
													}
												}
												// 预处理
												const _interfaceInfo = isFunction(syntheticalConfig.preproccessInterface)
													? syntheticalConfig.preproccessInterface(
															cloneDeepFast(interfaceInfo),
															changeCase,
															syntheticalConfig,
													  )
													: interfaceInfo;
												return _interfaceInfo;
											})
											.filter(Boolean) as any;
										interfaceList.sort((a, b) => a._id - b._id);
										this.interfaceList.push(
											...interfaceList.map(interfaceInfo => ({
												syntheticalConfig,
												interfaceInfo,
											})),
										);
									}),
								);
							}),
						);
					}),
				);
			}),
		);
		this.total = this.interfaceList.length;
		return this.total;
	}

	/** 生成 */
	async generate(spinner: Ora): Promise<void> {
		if (!this.interfaceList.length) return;
		await this.genMockCode(spinner);
	}

	/** 写入文件 */
	write(outputFileList: OutputFileList) {
		return Promise.all(
			Object.keys(outputFileList).map(async outputFilePath => {
				const { content, syntheticalConfig } = outputFileList[outputFilePath];

				// 始终写入主文件
				const rawOutputContent = dedent`
          /* tslint:disable */
          /* eslint-disable */

          /* 该文件工具自动生成，请勿直接修改！！！ */
         
          // @ts-ignore

					${
						this.config?.mockImportStatement?.() ??
						`
					import mockjs from 'mockjs';
					import { defineMock } from 'yapi-ai-mock';
					`
					}
       
          ${content.join('\n\n').trim()}
        `;

				// ref: https://prettier.io/docs/en/options.html
				const [prettyOutputContent] = await this.prettierFile(rawOutputContent);
				const outputContent = `${dedent`
          /* prettier-ignore-start */
          ${prettyOutputContent}
          /* prettier-ignore-end */
        `}\n`;
				await fs.outputFile(outputFilePath, outputContent);

				// 如果要生成 JavaScript 代码，
				// 则先对主文件进行 tsc 编译，主文件引用到的其他文件也会被编译，
				// 然后，删除原始的 .tsx? 文件。
				if (syntheticalConfig.target === 'javascript') {
					await this.tsc(outputFilePath);
					await Promise.all([fs.remove(outputFilePath).catch(noop)]);
				}
			}),
		);
	}

	/** 生成文件代码 */
	generateCode(syntheticalConfig: SyntheticalConfig, interfaceInfo: Interface) {
		const extendedInterfaceInfo: ExtendedInterface = {
			...interfaceInfo,
			parsedPath: path.parse(interfaceInfo.path),
		};

		// 接口注释
		const genComment = (genTitle: (title: string) => string) => {
			const {
				enabled: isEnabled = true,
				title: hasTitle = true,
				category: hasCategory = true,
				tag: hasTag = true,
				requestHeader: hasRequestHeader = true,
				updateTime: hasUpdateTime = true,
				link: hasLink = true,
				extraTags,
			} = {
				...syntheticalConfig.comment,
			} as CommentConfig;
			if (!isEnabled) {
				return '';
			}
			// 转义标题中的 /
			const escapedTitle = String(extendedInterfaceInfo.title).replace(/\//g, '\\/');
			const description = hasLink
				? `[${escapedTitle}↗](${extendedInterfaceInfo._url})`
				: escapedTitle;
			const summary: Array<
				| false
				| {
						label: string;
						value: string | string[];
				  }
			> = [
				hasCategory && {
					label: '分类',
					value: hasLink
						? `[${extendedInterfaceInfo._category.name}↗](${extendedInterfaceInfo._category._url})`
						: extendedInterfaceInfo._category.name,
				},
				hasTag && {
					label: '标签',
					value: extendedInterfaceInfo.tag.map(tag => `\`${tag}\``),
				},
				hasRequestHeader && {
					label: '请求头',
					value: `\`${extendedInterfaceInfo.method.toUpperCase()} ${extendedInterfaceInfo.path}\``,
				},
				hasUpdateTime && {
					label: '更新时间',
					value: process.env.JEST_WORKER_ID // 测试时使用 unix 时间戳
						? String(extendedInterfaceInfo.up_time)
						: /* istanbul ignore next */
						  `\`${dayjs(extendedInterfaceInfo.up_time * 1000).format('YYYY-MM-DD HH:mm:ss')}\``,
				},
			];
			if (typeof extraTags === 'function') {
				const tags = extraTags(extendedInterfaceInfo);
				for (const tag of tags) {
					(tag.position === 'start' ? summary.unshift : summary.push).call(summary, {
						label: tag.name,
						value: tag.value,
					});
				}
			}
			const titleComment = hasTitle
				? dedent`
            * ${genTitle(description)}
            *
          `
				: '';
			const extraComment: string = summary
				.filter(item => typeof item !== 'boolean' && !isEmpty(item.value))
				.map(item => {
					const _item: Exclude<(typeof summary)[0], boolean> = item as any;
					return `* @${_item.label} ${castArray(_item.value).join(', ')}`;
				})
				.join('\n');
			return dedent`
        /**
         ${[titleComment, extraComment].filter(Boolean).join('\n')}
         */
      `;
		};

		// 接口元信息
		const mockConstruction: MockConstruction = {
			comment: genComment(title => `接口 ${title} 的 **Mock配置**`),
			path: extendedInterfaceInfo.path,
			method: extendedInterfaceInfo.method,
			mockCode: extendedInterfaceInfo._mockCode,
			hash: extendedInterfaceInfo._hash,
		};

		// 通过配置文件中的 `mockStatement` 方法来生成 mock 代码
		const code = isFunction(this.config?.mockStatement)
			? this.config?.mockStatement(mockConstruction)
			: indent`
			/* hash: ${mockConstruction.hash} */

			${mockConstruction.comment}
			export default defineMock({
				url: '${this.config?.mockPrefix || '/mock'}${mockConstruction.path}',
				method: '${mockConstruction.method}',
				body: mockjs.mock(
					${mockConstruction.mockCode || '{}'}
				),
			});
		`;

		return code;
	}

	/** 生成 mock 代码 */
	async genMockCode(spinner: Ora) {
		const maxLength = Math.floor(
			Number(process.env['OPENAI_MAX_TOKENS'] || OPENAI_MAX_TOKENS) * 1.5,
		);
		const schema = fs.readFileSync(path.join(__dirname, 'assets/mockSchema.ts'), 'utf8');
		// 剩余长度
		const surplusLength = maxLength - (schema.length + 200);
		const responseBodyList = this.interfaceList.map(i => ({
			id: i?.interfaceInfo?._id,
			res_body: i?.interfaceInfo?._parsedResBody,
		}));
		const inputList: string[] = [];
		// 输入按长度分组
		while (responseBodyList.length > 0) {
			const input: Record<number, object> = {};
			[...responseBodyList].forEach(item => {
				const _input = JSON.stringify({ ...input, [item.id]: item.res_body });
				if (_input.length < surplusLength) {
					input[item.id] = item.res_body;
					responseBodyList.splice(
						responseBodyList.findIndex(i => i.id === item.id),
						1,
					);
				}
			});
			Object.keys(input).length && inputList.push(JSON.stringify(input));
		}
		// 根据分组的输入，获取 mock 代码
		await Promise.all(
			inputList.map(async input => {
				const mockResult = await chat(input, schema, this.config);
				const outputFileList: OutputFileList = Object.create(null);
				// 生成代码
				await Promise.all(
					Object.keys(mockResult).map(async id => {
						const { interfaceInfo, syntheticalConfig } =
							this.interfaceList.find(i => i?.interfaceInfo?._id === Number(id)) || {};
						if (interfaceInfo && syntheticalConfig) {
							// mock 结果处理
							isFunction(this.config?.proccessMockResult)
								? this.config?.proccessMockResult(mockResult[Number(id)], interfaceInfo)
								: proccessMockResult(mockResult[Number(id)], interfaceInfo);
							interfaceInfo._mockCode = mockResult[Number(id)]
								? JSON.stringify(mockResult[Number(id)])
								: '';
							const code = this.generateCode(syntheticalConfig, interfaceInfo);
							outputFileList[interfaceInfo._outputFilePath] = {
								syntheticalConfig,
								content: [code],
							};
						}
					}),
				);
				// 写入文件
				await this.write(outputFileList);
				// 更新进度
				this.completed += Object.keys(mockResult).length;
				spinner.color = 'yellow';
				spinner.text = `正在生成代码并写入文件... (已完成: ${this.completed}/${this.total})`;
			}),
		);
	}

	async prettierFile(content: string): Promise<[string, boolean]> {
		let result = content;
		let hasError = false;
		try {
			result = await prettier.format(content, {
				singleQuote: true,
				trailingComma: 'all',
				printWidth: 100,
				parser: 'typescript',
				...(await getCachedPrettierOptions()),
			});
		} catch (error) {
			hasError = true;
		}
		return [result, hasError];
	}

	tsc(file: string) {
		return new Promise<void>(resolve => {
			// add this to fix bug that not-generator-file-on-window
			const command = `${require('os').platform() === 'win32' ? 'node ' : ''}${JSON.stringify(
				require.resolve(`typescript/bin/tsc`),
			)}`;

			exec(
				`${command} --target ES2019 --module ESNext --jsx preserve --declaration --esModuleInterop ${JSON.stringify(
					file,
				)}`,
				{
					cwd: this.options.cwd,
					env: process.env,
				},
				() => resolve(),
			);
		});
	}

	async fetchApi<T = any>(url: string, query: Record<string, any>): Promise<T> {
		const res = await httpGet<{
			errcode: any;
			errmsg: any;
			data: any;
		}>(url, query);
		/* istanbul ignore next */
		if (res && res.errcode) {
			throwError(res.errmsg);
		}
		return res.data || res;
	}

	/** 获取接口分类列表 */
	fetchExport: ({
		serverUrl,
		token,
	}: Partial<ServerConfig & ProjectConfig & CategoryConfig>) => Promise<Category[]> = memoize(
		async ({ serverUrl, token }: SyntheticalConfig) => {
			const projectInfo = await this.fetchProject({ serverUrl, token });
			const categoryList = await this.fetchApi<CategoryList>(`${serverUrl}/api/plugin/export`, {
				type: 'json',
				status: 'all',
				isWiki: 'false',
				token: token!,
			});
			return categoryList.map(cat => {
				const projectId = cat.list?.[0]?.project_id || 0;
				const catId = cat.list?.[0]?.catid || 0;
				// 实现分类在 YApi 上的地址
				cat._url = `${serverUrl}/project/${projectId}/interface/api/cat_${catId}`;
				cat.list = (cat.list || []).map(item => {
					const interfaceId = item._id;
					// 实现接口在 YApi 上的地址
					item._url = `${serverUrl}/project/${projectId}/interface/api/${interfaceId}`;
					item.path = `${projectInfo.basepath}${item.path}`;
					return item;
				});
				return cat;
			});
		},
		({ serverUrl, token }: SyntheticalConfig) => `${serverUrl}|${token}`,
	);

	fetchProject: ({
		serverUrl,
		token,
	}: Partial<ServerConfig & ProjectConfig & CategoryConfig>) => Promise<Project> = memoize(
		async ({ serverUrl, token }: SyntheticalConfig) => {
			const projectInfo = await this.fetchApi<Project>(`${serverUrl}/api/project/get`, {
				token: token!,
			});
			const basePath = `/${projectInfo.basepath || '/'}`.replace(/\/+$/, '').replace(/^\/+/, '/');
			projectInfo.basepath = basePath;
			// 实现项目在 YApi 上的地址
			projectInfo._url = `${serverUrl}/project/${projectInfo._id}/interface/api`;
			return projectInfo;
		},
		({ serverUrl, token }: SyntheticalConfig) => `${serverUrl}|${token}`,
	);

	/** 获取项目信息 */
	async fetchProjectInfo(syntheticalConfig: SyntheticalConfig) {
		const projectInfo = await this.fetchProject(syntheticalConfig);
		const projectCats = await this.fetchApi<CategoryList>(
			`${syntheticalConfig.serverUrl}/api/interface/getCatMenu`,
			{
				token: syntheticalConfig.token!,
				project_id: projectInfo._id,
			},
		);
		return {
			...projectInfo,
			cats: projectCats,
		};
	}

	/** 获取分类的接口列表 */
	async fetchInterfaceList({ serverUrl, token, id }: SyntheticalConfig): Promise<InterfaceList> {
		const category = ((await this.fetchExport({ serverUrl, token })) || []).find(
			cat => !isEmpty(cat) && !isEmpty(cat.list) && cat.list[0].catid === id,
		);

		if (category) {
			category.list.forEach(interfaceInfo => {
				// 实现 _category 字段
				interfaceInfo._category = omit(category, ['list']);
			});
		}

		return category ? category.list : [];
	}
}
