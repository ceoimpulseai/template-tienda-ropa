import { Sequelize } from 'sequelize';
import { env, isTest } from './env.js';

function createSequelize(): Sequelize {
  if (isTest) {
    return new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  }

  const hasPostgresConfig = Boolean(env.DATABASE_URL || (env.DB_HOST && env.DB_NAME && env.DB_USER));

  if (!hasPostgresConfig) {
    // ponytail: fallback a SQLite local para desarrollo sin depender de un Postgres corriendo.
    return new Sequelize({ dialect: 'sqlite', storage: './dev.sqlite', logging: false });
  }

  if (env.DATABASE_URL) {
    return new Sequelize(env.DATABASE_URL, { dialect: 'postgres', logging: false });
  }

  return new Sequelize(env.DB_NAME!, env.DB_USER!, env.DB_PASSWORD, {
    host: env.DB_HOST,
    port: env.DB_PORT ?? 5432,
    dialect: 'postgres',
    logging: false,
  });
}

export const sequelize = createSequelize();
