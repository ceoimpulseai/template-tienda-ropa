import express from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { routes } from '../routes/index.js';
import { errorHandler } from '../middleware/errorHandler.js';

export function createTestApp() {
  const app = express();
  app.use('/api/auth', authRoutes);
  app.use(express.json());
  app.use('/api', routes);
  app.use(errorHandler);
  return app;
}
