import {
	castArray,
	cloneDeepFast,
	dedent,
	groupBy,
	isEmpty,
	isFunction,
	last,
	memoize,
	noop,
	omit,
	uniq,
	values,
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
	InterfaceList,
	Method,
	MockConstruction,
	Project,
	ProjectConfig,
	ServerConfig,
	SyntheticalConfig,
} from './types';
import { getCachedPrettierOptions, httpGet, sortByWeights, throwError } from './utils';
import * as fs from 'fs-extra';
import path from 'path';
import dayjs from 'dayjs';
import prettier from 'prettier';
import { exec } from 'child_process';

interface OutputFileList {
	[outputFilePath: string]: {
		syntheticalConfig: SyntheticalConfig;
		content: string[];
	};
}

/** 生成代码 */
export class Generator {
	/** 配置 */
	private config: ServerConfig[] = [];

	constructor(
		config: Config,
		private options: { cwd: string } = { cwd: process.cwd() }
	) {
		// config 可能是对象或数组，统一为数组
		this.config = castArray(config);
	}

	/** 前置方法，统一配置项 */
	async prepare(): Promise<void> {
		this.config = await Promise.all(
			// config 可能是对象或数组，统一为数组
			this.config.map(async (item) => {
				if (item.serverUrl) {
					item.serverUrl = item.serverUrl.replace(/\/+$/, '');
				}
				return item;
			})
		);
	}

	/** 生成 mock 配置，返回 */
	async generate(): Promise<OutputFileList> {
		const outputFileList: OutputFileList = Object.create(null);

		await Promise.all(
			this.config.map(async (serverConfig, serverIndex) => {
				const projects = serverConfig.projects.reduce<ProjectConfig[]>((projects, project) => {
					projects.push(
						...castArray(project.token).map((token) => ({
							...project,
							token: token,
						}))
					);
					return projects;
				}, []);
				console.log('projects: ', projects);
				return Promise.all(
					projects.map(async (projectConfig, projectIndex) => {
						const projectInfo = await this.fetchProjectInfo({
							...serverConfig,
							...projectConfig,
						});
						console.log('projectInfo: ', projectInfo);
						await Promise.all(
							projectConfig.categories.map(async (categoryConfig, categoryIndex) => {
								// 分类处理
								// 数组化
								let categoryIds = castArray(categoryConfig.id);
								// 全部分类
								if (categoryIds.includes(0)) {
									categoryIds.push(...projectInfo.cats.map((cat) => cat._id));
								}
								// 唯一化
								categoryIds = uniq(categoryIds);
								// 去掉被排除的分类
								const excludedCategoryIds = categoryIds.filter((id) => id < 0).map(Math.abs);
								categoryIds = categoryIds.filter((id) => !excludedCategoryIds.includes(Math.abs(id)));
								// 删除不存在的分类
								categoryIds = categoryIds.filter((id) => !!projectInfo.cats.find((cat) => cat._id === id));
								// 顺序化
								categoryIds = categoryIds.sort();
								console.log('categoryIds: ', categoryIds);

								const codes = (
									await Promise.all(
										categoryIds.map<
											Promise<
												Array<{
													outputFilePath: string;
													code: string;
													weights: number[];
												}>
											>
										>(async (id, categoryIndex2) => {
											categoryConfig = {
												...categoryConfig,
												id: id,
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
												.map((interfaceInfo) => {
													// 实现 _project 字段
													interfaceInfo._project = omit(projectInfo, ['cats']);
													return interfaceInfo;
												})
												.filter(Boolean) as any;
											interfaceList.sort((a, b) => a._id - b._id);

											await this.getMockCode(syntheticalConfig, interfaceList);

											const interfaceCodes = await Promise.all(
												interfaceList.map<
													Promise<{
														categoryUID: string;
														outputFilePath: string;
														weights: number[];
														code: string;
													}>
												>(async (interfaceInfo) => {
													const outputFilePath = path.resolve(
														this.options.cwd,
														typeof syntheticalConfig.outputFilePath === 'function'
															? syntheticalConfig.outputFilePath(interfaceInfo, changeCase)
															: syntheticalConfig.outputFilePath!
													);
													const categoryUID = `_${serverIndex}_${projectIndex}_${categoryIndex}_${categoryIndex2}`;

													const code = await this.generateCode(
														syntheticalConfig,
														interfaceInfo
														// categoryUID,
													);
													const weights: number[] = [serverIndex, projectIndex, categoryIndex, categoryIndex2];
													return {
														categoryUID,
														outputFilePath,
														weights,
														code,
													};
												})
											);

											const groupedInterfaceCodes = groupBy(interfaceCodes, (item) => item.outputFilePath);

											return Object.keys(groupedInterfaceCodes).map((outputFilePath) => {
												const data = groupedInterfaceCodes[outputFilePath];
												const categoryCode = [...sortByWeights(data).map((item) => item.code)]
													.filter(Boolean)
													.join('\n\n');

												if (!outputFileList[outputFilePath]) {
													outputFileList[outputFilePath] = {
														syntheticalConfig,
														content: [],
													};
												}
												return {
													outputFilePath: outputFilePath,
													code: categoryCode,
													weights: last(sortByWeights(groupedInterfaceCodes[outputFilePath]))!.weights,
												};
											});
										})
									)
								).flat();

								for (const groupedCodes of values(groupBy(codes, (item) => item.outputFilePath))) {
									sortByWeights(groupedCodes);
									outputFileList[groupedCodes[0].outputFilePath].content.push(...groupedCodes.map((item) => item.code));
								}
							})
						);
					})
				);
			})
		);

		return outputFileList;
	}

	/** 写入文件 */
	async write(outputFileList: OutputFileList) {
		return Promise.all(
			Object.keys(outputFileList).map(async (outputFilePath) => {
				let { content, syntheticalConfig } = outputFileList[outputFilePath];

				// 始终写入主文件
				const rawOutputContent = dedent`
          /* tslint:disable */
          /* eslint-disable */

          /* 该文件工具自动生成，请勿直接修改！！！ */
         
          // @ts-ignore
       
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
			})
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

	async tsc(file: string) {
		return new Promise<void>((resolve) => {
			// add this to fix bug that not-generator-file-on-window
			const command = `${require('os').platform() === 'win32' ? 'node ' : ''}${JSON.stringify(
				require.resolve(`typescript/bin/tsc`)
			)}`;

			exec(
				`${command} --target ES2019 --module ESNext --jsx preserve --declaration --esModuleInterop ${JSON.stringify(
					file
				)}`,
				{
					cwd: this.options.cwd,
					env: process.env,
				},
				() => resolve()
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
	fetchExport: ({ serverUrl, token }: Partial<ServerConfig & ProjectConfig & CategoryConfig>) => Promise<Category[]> =
		memoize(
			async ({ serverUrl, token }: SyntheticalConfig) => {
				const projectInfo = await this.fetchProject({ serverUrl, token });
				const categoryList = await this.fetchApi<CategoryList>(`${serverUrl}/api/plugin/export`, {
					type: 'json',
					status: 'all',
					isWiki: 'false',
					token: token!,
				});
				return categoryList.map((cat) => {
					const projectId = cat.list?.[0]?.project_id || 0;
					const catId = cat.list?.[0]?.catid || 0;
					// 实现分类在 YApi 上的地址
					cat._url = `${serverUrl}/project/${projectId}/interface/api/cat_${catId}`;
					cat.list = (cat.list || []).map((item) => {
						const interfaceId = item._id;
						// 实现接口在 YApi 上的地址
						item._url = `${serverUrl}/project/${projectId}/interface/api/${interfaceId}`;
						item.path = `${projectInfo.basepath}${item.path}`;
						return item;
					});
					return cat;
				});
			},
			({ serverUrl, token }: SyntheticalConfig) => `${serverUrl}|${token}`
		);

	fetchProject: ({ serverUrl, token }: Partial<ServerConfig & ProjectConfig & CategoryConfig>) => Promise<Project> =
		memoize(
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
			({ serverUrl, token }: SyntheticalConfig) => `${serverUrl}|${token}`
		);

	/** 获取项目信息 */
	async fetchProjectInfo(syntheticalConfig: SyntheticalConfig) {
		const projectInfo = await this.fetchProject(syntheticalConfig);
		const projectCats = await this.fetchApi<CategoryList>(`${syntheticalConfig.serverUrl}/api/interface/getCatMenu`, {
			token: syntheticalConfig.token!,
			project_id: projectInfo._id,
		});
		return {
			...projectInfo,
			cats: projectCats,
		};
	}

	/** 获取分类的接口列表 */
	async fetchInterfaceList({ serverUrl, token, id }: SyntheticalConfig): Promise<InterfaceList> {
		const category = ((await this.fetchExport({ serverUrl, token })) || []).find(
			(cat) => !isEmpty(cat) && !isEmpty(cat.list) && cat.list[0].catid === id
		);

		if (category) {
			category.list.forEach((interfaceInfo) => {
				// 实现 _category 字段
				interfaceInfo._category = omit(category, ['list']);
			});
		}

		return category ? category.list : [];
	}

	/** 生成代码 */
	async generateCode(syntheticalConfig: SyntheticalConfig, interfaceInfo: Interface) {
		const extendedInterfaceInfo: ExtendedInterface = {
			...interfaceInfo,
			parsedPath: path.parse(interfaceInfo.path),
		};
		const mockFunctionName = isFunction(syntheticalConfig.getMockFunctionName)
			? await syntheticalConfig.getMockFunctionName(extendedInterfaceInfo, changeCase)
			: changeCase.camelCase(extendedInterfaceInfo.parsedPath.name);

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
			const description = hasLink ? `[${escapedTitle}↗](${extendedInterfaceInfo._url})` : escapedTitle;
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
					value: extendedInterfaceInfo.tag.map((tag) => `\`${tag}\``),
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
				.filter((item) => typeof item !== 'boolean' && !isEmpty(item.value))
				.map((item) => {
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
			comment: genComment((title) => `接口 ${title} 的 **Mock配置**`),
			mockFunctionName: mockFunctionName,
			path: JSON.stringify(extendedInterfaceInfo.path),
			method: extendedInterfaceInfo.method,
		};

		// 通过配置文件中的 `mockStatement` 方法来生成 mock 代码
		const code = syntheticalConfig.mockStatement ? syntheticalConfig.mockStatement(mockConstruction) : '';

		return code;
	}

	/** 生成 mock 代码 */
	async getMockCode(syntheticalConfig: SyntheticalConfig, interfaceList: InterfaceList) {}
}
