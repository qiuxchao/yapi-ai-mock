import express from 'express';
import consola from 'consola';
import { mockServerMiddleware } from './mockMiddleware';
import { PORT } from '../constant';
import { MockServerConfig } from '@/types';
import cors from 'cors';
const app = express();

const mockServer = async (config: MockServerConfig = {}) => {
  const port = config?.port || PORT;
  const middleware = await mockServerMiddleware(null, config);

  app.use(cors());
  app.use(middleware);

  app.use((req, res, next) => {
    res.statusCode = 404;
    res.statusMessage = 'Not Found';
    res.end('Not Found');
    next();
  });

  const server = app.listen(port, () => {
    consola.start(`Mock Server At:  http://localhost:${port}`);
  });

  // ctrl + c 关闭服务
  process.on('SIGINT', () => {
    server.close(() => {
      consola.fail('Mock Server:  Closed.');
      process.exit(0);
    });
  });
};

export default mockServer;
