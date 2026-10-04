import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { sequelize } from './config/database.js';
import './models/index.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { routes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

await sequelize.sync();

// Ensure arca_store table exists (used by ARCA SDK ticket storage)
await sequelize.query(`
  CREATE TABLE IF NOT EXISTS arca_store (
    id TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

if (env.NODE_ENV !== 'production') {
  try {
    const { runSeeds } = await import('./seed/index.js');
    await runSeeds();
  } catch (err) {
    console.warn('Seed process failed (likely first run - better-auth tables not created yet):', err instanceof Error ? err.message : err);
  }
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
