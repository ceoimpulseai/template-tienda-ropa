import { Supplier } from '../modules/suppliers/supplier.model.js';

const BUSINESS_ID = 'b2c3d4e5-f6a7-8901-bcde-f23456789012';

const DEMO_SUPPLIERS = [
  {
    id: 'f8a9b0c1-d2e3-4567-1234-567890123456',
    businessId: BUSINESS_ID,
    name: 'Textil Mayorista del Centro',
    email: 'ventas@textilcentro.com.ar',
    phone: '+5491144445555',
    address: 'Av. Corrientes 2500, CABA',
    notes: 'Proveedor principal de remeras, buzos, musculosas y básicos de algodón. Entrega en 48hs.',
    garmentTypes: ['remera', 'buzo', 'musculosa', 'camiseta'],
    minOrderQuantity: 12,
    leadTimeDays: 3,
  },
  {
    id: 'a9b0c1d2-e3f4-5678-2345-678901234567',
    businessId: BUSINESS_ID,
    name: 'Denim Argentina S.A.',
    email: 'pedidos@denimarg.com.ar',
    phone: '+5491155556666',
    address: 'Int. Huergo 1200, Parque Patricios, CABA',
    notes: 'Fabricante de jeans y pantalones de denim. Variedad de lavados y cortes. Mínimo 6 unidades por talle.',
    garmentTypes: ['pantalon', 'jean', 'short'],
    minOrderQuantity: 6,
    leadTimeDays: 7,
  },
  {
    id: 'b0c1d2e3-f4a5-6789-3456-789012345678',
    businessId: BUSINESS_ID,
    name: 'Calzado Urbano Importado',
    email: 'comercial@calzadouurbano.com',
    phone: '+5491166667777',
    address: 'Av. Rivadavia 8500, Flores, CABA',
    notes: 'Importador de zapatillas urbanas y deportivas. Stock permanente en talles 38-44. Envíos a todo el país.',
    garmentTypes: ['calzado', 'zapatilla'],
    minOrderQuantity: 8,
    leadTimeDays: 10,
  },
  {
    id: 'c1d2e3f4-a5b6-7890-cdef-123456789012',
    businessId: BUSINESS_ID,
    name: 'Confecciones Flor de Luna',
    email: 'hola@flordeluna.com.ar',
    phone: '+5491133334444',
    address: 'Scalabrini Ortiz 1800, Palermo, CABA',
    notes: 'Taller de confección de vestidos, polleras y blusas. Producción en series chicas (12-24 u). Diseños exclusivos.',
    garmentTypes: ['vestido', 'pollera', 'blusa', 'camisa'],
    minOrderQuantity: 12,
    leadTimeDays: 14,
  },
  {
    id: 'd2e3f4a5-b6c7-8901-def0-234567890123',
    businessId: BUSINESS_ID,
    name: 'Accesorios de Cuero Sur',
    email: 'ventas@accesorioscuero.com.ar',
    phone: '+5491177778888',
    address: 'Av. San Juan 3200, Constitución, CABA',
    notes: 'Marroquinería: cinturones, billeteras, mochilas. Cuero vacuno curtido vegetal. Personalización con logo.',
    garmentTypes: ['accesorio', 'cinturon', 'mochila', 'billetera'],
    minOrderQuantity: 10,
    leadTimeDays: 5,
  },
  {
    id: 'e3f4a5b6-c7d8-9012-ef01-345678901234',
    businessId: BUSINESS_ID,
    name: 'Outdoor Gear Argentina',
    email: 'info@outdoorgear.com.ar',
    phone: '+5491188889999',
    address: 'Av. Cabildo 3500, Núñez, CABA',
    notes: 'Especialistas en camperas técnicas, rompevientos, buzos polares. Telas impermeables y transpirables.',
    garmentTypes: ['campera', 'buzo', 'rompevientos'],
    minOrderQuantity: 6,
    leadTimeDays: 7,
  },
];

export async function seedSuppliers() {
  for (const supplier of DEMO_SUPPLIERS) {
    const existing = await Supplier.findOne({
      where: { businessId: supplier.businessId, name: supplier.name },
    });

    if (!existing) {
      await Supplier.create(supplier);
      console.log(`Supplier created: ${supplier.name}`);
    } else {
      console.log(`Supplier already exists: ${existing.name}`);
    }
  }

  return DEMO_SUPPLIERS;
}