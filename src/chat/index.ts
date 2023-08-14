import { TypeChatLanguageModel, createJsonTranslator, success, error } from 'typechat';
import { MockResponse } from './mockSchema';
import nodeFetch from 'node-fetch';
import consola from 'consola';
import fs from 'fs-extra';
import path from 'path';

const chat = async (gptUrl: string, question: string) => {
	const model: TypeChatLanguageModel = {
		complete: async function complete(prompt) {
			try {
				const response: any = await nodeFetch(gptUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						temperature: 0,
						n: 1,
						messages: [{ role: 'user', content: prompt }],
					}),
				});
				const json = await response.json();
				return success(json.data.content as string);
			} catch (err) {
				consola.error('mock 请求错误: ', err);
				return error('请求错误');
			}
		},
	};
	const schema = fs.readFileSync(path.join(__dirname, 'mockSchema.ts'), 'utf8');
	const translator = createJsonTranslator<MockResponse>(model, schema, 'MockResponse');
	const response = await translator.translate(question);
	if (!response.success) {
		consola.error(response.message);
		return {};
	}
	return response.data;
};

export default chat;
