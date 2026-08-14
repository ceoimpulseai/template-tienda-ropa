import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { env } from './env.js';
import { sendEmail } from '../lib/email.js';

// better-auth mantiene sus propias tablas (user/session) vía un pool pg dedicado,
// independiente de la conexión Sequelize usada para el resto del dominio.
// Requiere Postgres — no soporta el fallback SQLite de desarrollo de database.ts
// (igual que en los proyectos originales de referencia de este template).
const pool = env.DATABASE_URL
  ? new Pool({ connectionString: env.DATABASE_URL })
  : new Pool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    });

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.APP_URL],
  database: pool,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Restablecer contraseña',
        html: `<p>Pediste restablecer tu contraseña. <a href="${url}">Hacé click acá para elegir una nueva</a>.</p><p>Si no fuiste vos, ignorá este email.</p>`,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
  },
});
