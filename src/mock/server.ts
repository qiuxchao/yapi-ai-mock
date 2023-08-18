import express from 'express';
import consola from 'consola';
import { mockServerMiddleware } from './mockMiddleware';
import { INCLUDE, PORT, PREFIX } from '../constant';
import { MockServerConfig } from '@/types';
const app = express();

const mockServer = async (config: MockServerConfig = {}) => {
	const include = config?.include || INCLUDE;
	const prefix = config?.prefix || PREFIX;
	const port = config?.port || PORT;
	const middleware = await mockServerMiddleware(null, {
		include,
		prefix,
	});
	app.use(middleware);

	const server = app.listen(port, () => {
		consola.start(`Mock Server At:  http://localhost:${port}`);
	});

	app.use((req, res, next) => {
		res.statusCode = 200;
		res.statusMessage = 'OK';
		res.setHeader('Content-Type', 'application/json');
		res.end(
			JSON.stringify({
				code: 0,
				message: 'success',
				data: 'default mock response',
			}),
		);
		next();
	});

	process.on('SIGINT', () => {
		server.close(() => {
			consola.fail('Mock Server:  Closed.');
			process.exit(0);
		});
	});
};

export default mockServer;
