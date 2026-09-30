import { NotFoundError } from '../../lib/errors.js';
import { Business } from './business.model.js';
import type { UpdateBusinessInput } from '@template/shared';
import { getPermissionsForRole } from '@template/shared';
import { encryptPem, decryptPem } from '../../lib/arca/crypto.js';

export const businessService = {
  async getById(businessId: string) {
    return Business.findByPk(businessId);
  },

  async update(businessId: string, input: UpdateBusinessInput) {
    const business = await Business.findByPk(businessId);
    if (!business) throw new NotFoundError('BUSINESS_NOT_FOUND');
    return business.update(input);
  },

  getPermissionsForRole(role: string) {
    return getPermissionsForRole(role as any);
  },

  async getArcaConfig(businessId: string) {
    const business = await Business.findByPk(businessId);
    if (!business) throw new NotFoundError('BUSINESS_NOT_FOUND');
    return {
      taxId: business.taxId ?? null,
      issuerCondition: business.issuerCondition ?? null,
      arcaEnvironment: business.arcaEnvironment ?? 'homologation',
      arcaConfigured: !!(business.arcaCertPem && business.arcaPrivateKeyPem),
    };
  },

  async updateArcaConfig(
    businessId: string,
    input: {
      cuit: string;
      issuerCondition: string;
      arcaEnvironment?: string;
      certPem?: string;
      keyPem?: string;
    },
  ) {
    const business = await Business.findByPk(businessId);
    if (!business) throw new NotFoundError('BUSINESS_NOT_FOUND');

    const updateData: any = {
      taxId: input.cuit.replace(/\D/g, ''), // normalize CUIT: remove hyphens/spaces
      issuerCondition: input.issuerCondition,
    };

    if (input.arcaEnvironment !== undefined) {
      updateData.arcaEnvironment = input.arcaEnvironment;
    }

    // Encrypt PEMs if both provided (Zod validates they come together)
    if (input.certPem && input.keyPem) {
      updateData.arcaCertPem = encryptPem(businessId, input.certPem);
      updateData.arcaPrivateKeyPem = encryptPem(businessId, input.keyPem);
    }

    await business.update(updateData);

    return {
      taxId: updateData.taxId,
      issuerCondition: updateData.issuerCondition,
      arcaEnvironment: updateData.arcaEnvironment ?? business.arcaEnvironment,
      arcaConfigured: !!(
        (updateData.arcaCertPem ?? business.arcaCertPem) &&
        (updateData.arcaPrivateKeyPem ?? business.arcaPrivateKeyPem)
      ),
    };
  },
};
