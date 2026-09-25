import { randomUUID } from 'node:crypto';
import { hashPassword } from '@better-auth/utils/password';
import { sequelize } from '../config/database.js';

const DEMO_USER = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Usuario Demo',
  email: 'demo@template.local',
  password: 'Demo1234!',
};

export async function seedUsers() {
  const existing = await sequelize.query(
    `SELECT id FROM "user" WHERE email = :email`,
    { replacements: { email: DEMO_USER.email }, type: 'SELECT' }
  );

  if (existing.length === 0) {
    const passwordHash = await hashPassword(DEMO_USER.password);
    const now = new Date();

    await sequelize.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES (:id, :name, :email, true, :now, :now)`,
      {
        replacements: {
          id: DEMO_USER.id,
          name: DEMO_USER.name,
          email: DEMO_USER.email,
          now,
        },
      }
    );

    await sequelize.query(
      `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES (:id, :accountId, 'credential', :userId, :password, :now, :now)`,
      {
        replacements: {
          id: randomUUID(),
          accountId: DEMO_USER.email,
          userId: DEMO_USER.id,
          password: passwordHash,
          now,
        },
      }
    );

    console.log(`Demo user created: ${DEMO_USER.email}`);
  } else {
    console.log(`Demo user already exists: ${DEMO_USER.email}`);
  }

  return DEMO_USER;
}