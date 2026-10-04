import { DataTypes, type QueryInterface } from 'sequelize';
import type { Migration } from '../migrate.js';

const ROLE_ENUM_VALUES = ['admin', 'manager', 'operator', 'viewer'] as const;
const ROLE_ENUM_NAME = 'enum_business_members_role';

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${ROLE_ENUM_NAME}') THEN
        CREATE TYPE ${ROLE_ENUM_NAME} AS ENUM (${ROLE_ENUM_VALUES.map(v => `'${v}'`).join(', ')});
      END IF;
    END $$;
  `);

  await queryInterface.sequelize.query(`
    ALTER TABLE "business_members"
    ALTER COLUMN role TYPE ${ROLE_ENUM_NAME}
    USING role::text::${ROLE_ENUM_NAME};
  `);
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.sequelize.query(`
    ALTER TABLE "business_members"
    ALTER COLUMN role TYPE TEXT
    USING role::text;
  `);

  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS ${ROLE_ENUM_NAME};
  `);
};