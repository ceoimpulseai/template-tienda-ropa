import { Sequelize } from 'sequelize';
import { env, isTest } from './env.js';

const postgresPool = {
  max: 20,
  min: 2,
  acquire: 30000,
  idle: 10000,
};

function createSequelize(): Sequelize {
  if (isTest) {
    return new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  }

  const commonOptions = {
    dialect: 'postgres',
    logging: false,
    pool: postgresPool,
    quoteIdentifiers: true,
  };

  if (env.DATABASE_URL) {
    return new Sequelize(env.DATABASE_URL, commonOptions);
  }

  if (!env.DB_HOST || !env.DB_NAME || !env.DB_USER) {
    throw new Error('Postgres configuration required. Set DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD');
  }

  return new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
    host: env.DB_HOST,
    port: env.DB_PORT ?? 5432,
    ...commonOptions,
  });
}

export const sequelize = createSequelize();