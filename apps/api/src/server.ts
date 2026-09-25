import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { sequelize } from './config/database.js';
import './models/index.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { routes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

await sequelize.sync();

if (env.NODE_ENV !== 'production') {
  const { runSeeds } = await import('./seed/index.js');
  await runSeeds();
}

const app = express();

app.use(cors({ origin: env.APP_URL, credentials: true }));

// better-auth debe montarse antes de express.json(): parsea su propio body.
app.use('/api/auth', authRoutes);

app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});
