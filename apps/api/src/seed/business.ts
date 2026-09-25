import { Business } from '../modules/business/business.model.js';

const DEMO_BUSINESS = {
  id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  name: 'Mi Empresa Demo',
  currencySymbol: '$',
  taxPercent: 21,
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