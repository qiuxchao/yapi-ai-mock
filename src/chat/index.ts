import { OPENAI_API_KEY } from '@/constant';
import {
	TypeChatLanguageModel,
	createJsonTranslator,
	success,
	error,
	createLanguageModel,
} from 'typechat';
import { MockResponse } from './mockSchema';
import axios from 'axios';
import consola from 'consola';
import fs from 'fs-extra';
import path from 'path';
import { Config } from '..';
import { throwError } from '@/utils';

const chat = async (question: string, config: Omit<Config, 'yapi'>) => {
	const openaiApiKey = process.env.OPENAI_API_KEY || OPENAI_API_KEY;
	if (!openaiApiKey || !config?.chatModel) {
		throwError('未配置聊天模型，请配置 env.OPENAI_API_KEY 环境变量或者 config.chatModel');
	}
	const model: TypeChatLanguageModel = openaiApiKey
		? createLanguageModel(process.env)
		: config?.chatModel?.(axios, success, error);

	// {
	// 	complete: async prompt => {
	// 		try {
	// 			const response = await axios(gptUrl, {
	// 				method: 'POST',
	// 				headers: {
	// 					'Content-Type': 'application/json',
	// 				},
	// 				data: JSON.stringify({
	// 					temperature: 0,
	// 					n: 1,
	// 					messages: [{ role: 'user', content: prompt }],
	// 				}),
	// 			});
	// 			const json = response.data;
	// 			return success((json?.data?.content as string) ?? '');
	// 		} catch (err) {
	// 			return error(`mock 请求错误 ${err}`);
	// 		}
	// 	},
	// };
	const schema = fs.readFileSync(path.join(__dirname, 'mockSchema.ts'), 'utf8');
	const translator = createJsonTranslator<MockResponse>(model, schema, 'MockResponse');
	const response = await translator.translate(question);
	if (!response.success) {
		consola.warn('mock 请求解析错误', response.message);
		return {};
	}
	return response.data;
};

export default chat;
