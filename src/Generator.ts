import { castArray, cloneDeepFast, isEmpty, isFunction, memoize, omit, uniq } from 'vtils';
import {
	Category,
	CategoryConfig,
	CategoryList,
	Config,
	InterfaceList,
	Project,
	ProjectConfig,
	ServerConfig,
	SyntheticalConfig,
} from './types';
import { httpGet, throwError } from './utils';

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
											categoryIndex2 === 0 && console.log(syntheticalConfig, interfaceList);
											return interfaceList;

											// interfaceList = interfaceList
											// 	.map((interfaceInfo) => {
											// 		// 实现 _project 字段
											// 		interfaceInfo._project = omit(projectInfo, ['cats', 'getMockUrl', 'getDevUrl', 'getProdUrl']);
											// 		// 预处理
											// 		const _interfaceInfo = isFunction(syntheticalConfig.preproccessInterface)
											// 			? syntheticalConfig.preproccessInterface(
											// 					cloneDeepFast(interfaceInfo),
											// 					changeCase,
											// 					syntheticalConfig
											// 			  )
											// 			: interfaceInfo;

											// 		return _interfaceInfo;
											// 	})
											// 	.filter(Boolean) as any;
											// interfaceList.sort((a, b) => a._id - b._id);

											// const interfaceCodes = await Promise.all(
											// 	interfaceList.map<
											// 		Promise<{
											// 			categoryUID: string;
											// 			outputFilePath: string;
											// 			weights: number[];
											// 			code: string;
											// 			type: 'fn' | 'type';
											// 		}>
											// 	>(async (interfaceInfo) => {
											// 		const outputFilePath = path.resolve(
											// 			this.options.cwd,
											// 			typeof syntheticalConfig.outputFilePath === 'function'
											// 				? syntheticalConfig.outputFilePath(interfaceInfo, changeCase)
											// 				: syntheticalConfig.outputFilePath!
											// 		);
											// 		const categoryUID = `_${serverIndex}_${projectIndex}_${categoryIndex}_${categoryIndex2}`;

											// 		const { typeCode: code, fetchConstruction } = await this.generateInterfaceCode(
											// 			syntheticalConfig,
											// 			interfaceInfo
											// 			// categoryUID,
											// 		);
											// 		const weights: number[] = [serverIndex, projectIndex, categoryIndex, categoryIndex2];
											// 		return {
											// 			categoryUID,
											// 			outputFilePath,
											// 			weights,
											// 			code,
											// 			fetchConstruction,
											// 			type: 'type',
											// 		};
											// 	})
											// );
											//  这就是 分类
											// --

											// { categoryUID: string; outputFilePath: string; weights: number[]; code: string; }
											// const fetchFunctions = interfaceCodes.map((e: any) => ({
											// 	...e,
											// 	type: 'fn',
											// 	outputFilePath: e.outputFilePath,
											// 	code: (syntheticalConfig.requestStatement
											// 		? syntheticalConfig.requestStatement(e.fetchConstruction)
											// 		: '') as any,
											// }));

											// const groupedInterfaceCodes = groupBy(
											// 	interfaceCodes
											// 		.map((e: any) => {
											// 			e.outputFilePath = e.outputFilePath.replace(/\w+\.ts$/, 'typings.d.ts');
											// 			e.type = 'type';
											// 			return e;
											// 		})
											// 		.concat(fetchFunctions),
											// 	(item) => item.outputFilePath
											// );

											// return Object.keys(groupedInterfaceCodes).map((outputFilePath) => {
											// 	const data = groupedInterfaceCodes[outputFilePath];
											// 	const categoryCode = [...sortByWeights(data).map((item) => item.code)]
											// 		.filter(Boolean)
											// 		.join('\n\n');

											// 	const type = data[0].type;
											// 	if (!outputFileList[outputFilePath]) {
											// 		outputFileList[outputFilePath] = {
											// 			syntheticalConfig,
											// 			content: [],
											// 			type: type,
											// 			requestFunctionFilePath: syntheticalConfig.requestFunctionFilePath
											// 				? path.resolve(this.options.cwd, syntheticalConfig.requestFunctionFilePath)
											// 				: path.join(path.dirname(outputFilePath), 'request.ts'),
											// 			requestHookMakerFilePath:
											// 				syntheticalConfig.reactHooks && syntheticalConfig.reactHooks.enabled
											// 					? syntheticalConfig.reactHooks.requestHookMakerFilePath
											// 						? path.resolve(
											// 								this.options.cwd,
											// 								syntheticalConfig.reactHooks.requestHookMakerFilePath
											// 						  )
											// 						: path.join(path.dirname(outputFilePath), 'makeRequestHook.ts')
											// 					: '',
											// 		};
											// 	}
											// 	return {
											// 		type: type,
											// 		outputFilePath: outputFilePath,
											// 		code: categoryCode,
											// 		weights: last(sortByWeights(groupedInterfaceCodes[outputFilePath]))!.weights,
											// 	};
											// });
										})
									)
								).flat();

								// for (const groupedCodes of values(groupBy(codes, (item) => item.outputFilePath))) {
								// 	// outputFileList[groupedCodes[0].outputFilePath].type = groupedCodes.type
								// 	sortByWeights(groupedCodes);
								// 	outputFileList[groupedCodes[0].outputFilePath].content.push(...groupedCodes.map((item) => item.code));

								// 	outputFileList[groupedCodes[0].outputFilePath].type = groupedCodes[0].type;
								// }
							})
						);
					})
				);
			})
		);

		return outputFileList;
	}

	/** 写入文件 */
	async write(outputFileList: any) {}

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
}
