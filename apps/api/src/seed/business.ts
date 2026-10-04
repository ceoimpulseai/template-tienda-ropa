import { Business } from '../modules/business/business.model.js';

const DEMO_BUSINESS = {
  id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  name: 'Moda Tienda Demo',
  displayName: 'Moda Urbana',
  description: 'Tienda de indumentaria urbana y casual para toda la familia. Remeras, jeans, vestidos, calzado y accesorios.',
  currencySymbol: '$',
  taxPercent: 21,
  catalogWhatsapp: '+5491122223333',
  taxId: '30712345678',
  issuerCondition: 'IVA Responsable Inscripto',
  arcaEnvironment: 'homologation',
};

export async function seedBusiness() {
  const existing = await Business.findByPk(DEMO_BUSINESS.id);

  if (!existing) {
    await Business.create(DEMO_BUSINESS);
    console.log(`Business created: ${DEMO_BUSINESS.name}`);
  } else {
    console.log(`Business already exists: ${existing.name}`);
  }

  return DEMO_BUSINESS;
}