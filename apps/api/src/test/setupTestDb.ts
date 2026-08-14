import { sequelize } from '../config/database.js';
import '../models/index.js';

export async function resetTestDb() {
  await sequelize.sync({ force: true });
}
