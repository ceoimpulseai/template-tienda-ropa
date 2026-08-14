import { randomUUID } from 'node:crypto';
import { auth } from '../../config/auth.js';
import { Business } from '../business/business.model.js';
import { Branch } from '../branches/branch.model.js';
import { BusinessMember } from '../team/team.model.js';

export const authService = {
  // Registro self-service: crea el usuario Y un negocio nuevo con su sucursal default,
  // dejándolo como admin. Distinto del alta de un empleado (ver team.service.ts),
  // que suma un usuario a un negocio YA existente sin crear uno nuevo.
  async registerBusinessOwner(input: {
    name: string;
    email: string;
    password: string;
    businessName: string;
  }) {
    // returnHeaders: true — signUpEmail se llama server-side (no vía el handler HTTP de
    // better-auth), así que el Set-Cookie de sesión no se escribe solo: hay que reenviarlo
    // a mano en el controller o el cliente queda "registrado" pero deslogueado.
    const { headers, response } = await auth.api.signUpEmail({
      body: { name: input.name, email: input.email, password: input.password },
      returnHeaders: true,
    });

    const business = await Business.create({ id: randomUUID(), name: input.businessName });
    await Branch.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Sucursal Principal',
      isDefault: true,
    });
    await BusinessMember.create({
      id: randomUUID(),
      businessId: business.id,
      userId: response.user.id,
      role: 'admin',
    });

    return { user: response.user, business, headers };
  },
};
