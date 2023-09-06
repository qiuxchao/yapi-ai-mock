import express from 'express';
import consola from 'consola';
import { mockServerMiddleware } from './mockMiddleware';
import { INCLUDE, PORT, PREFIX } from '../constant';
import { MockServerConfig } from '@/types';
import { isFunction } from 'vtils';
const app = express();

const mockServer = async (config: MockServerConfig = {}) => {
  const include = config?.include || INCLUDE;
  const prefix = config?.prefix || PREFIX;
  const port = config?.port || PORT;
  const overwrite = isFunction(config?.overwrite) ? config.overwrite : () => [];
  const middleware = await mockServerMiddleware(null, {
    include,
    prefix,
    overwrite,
  });
  app.use(middleware);

  const server = app.listen(port, () => {
    consola.start(`Mock Server At:  http://localhost:${port}`);
  });

  app.use((req, res, next) => {
    res.statusCode = 404;
    res.statusMessage = 'Not Found';
    res.end('Not Found');
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
