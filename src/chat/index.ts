import { TypeChatLanguageModel, createJsonTranslator, success, error } from 'typechat';
import { MockResponse } from './mockSchema';
import axios from 'axios';
import consola from 'consola';
import fs from 'fs-extra';
import path from 'path';

const chat = async (gptUrl: string, question: string) => {
	const model: TypeChatLanguageModel = {
		// 重试次数
		retryMaxAttempts: 5,
		complete: async function complete(prompt) {
			try {
				const response = await axios(gptUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					data: JSON.stringify({
						temperature: 0,
						n: 1,
						messages: [{ role: 'user', content: prompt }],
					}),
				});
				const json = await response.data;
				return success((json?.data?.content as string) ?? '');
			} catch (err) {
				return error(`mock 请求错误 ${err}`);
			}
		},
	};
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
