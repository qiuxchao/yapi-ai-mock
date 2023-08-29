import { OPENAI_API_KEY, OPENAI_ENDPOINT } from '@/constant';
import {
	TypeChatLanguageModel,
	createJsonTranslator,
	success,
	error,
	createLanguageModel,
} from 'typechat';
import axios from 'axios';
import consola from 'consola';
import { Config } from '..';
import { throwError } from '@/utils';
import { isFunction } from 'vtils';

const chat = async (question: string, schema: string, config: Omit<Config, 'yapi'>) => {
	const openaiApiKey = process.env.OPENAI_API_KEY || OPENAI_API_KEY;
	if (!openaiApiKey && !config?.createLanguageModel) {
		throwError('未配置 LLM, 请配置 OPENAI_API_KEY 环境变量或者 config.createLanguageModel');
	}
	if (config?.createLanguageModel && !isFunction(config?.createLanguageModel)) {
		throwError('config.createLanguageModel 必须是一个函数');
	}
	const model: TypeChatLanguageModel = openaiApiKey
		? createLanguageModel(process.env)
		: config.createLanguageModel!(
				axios,
				success,
				error,
				process.env.OPENAI_ENDPOINT || OPENAI_ENDPOINT,
		  );
	const translator = createJsonTranslator<Record<number, any>>(model, schema, 'MockResponse');
	const response = await translator.translate(question);
	if (!response.success) {
		consola.warn('LLM 请求解析错误: ', response.message);
		return {};
	}
	return response.data;
};

export default chat;
