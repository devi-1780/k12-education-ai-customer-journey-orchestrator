import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { dbState } from './config/db.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ok',
    data: {
      uptimeSeconds: process.uptime(),
      db: dbState(),
      env: env.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
