import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '../config/database.js';
import '../models/index.js';

const umzug = new Umzug({
  migrations: { glob: 'src/db/migrations/*.ts' },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

export type Migration = typeof umzug._types.migration;

const command = process.argv[2];

if (command === 'up') {
  await umzug.up();
  console.log('Migrations applied');
  process.exit(0);
} else if (command === 'down') {
  await umzug.down();
  process.exit(0);
} else {
  console.error('Usage: tsx src/db/migrate.ts <up|down>');
  process.exit(1);
}
