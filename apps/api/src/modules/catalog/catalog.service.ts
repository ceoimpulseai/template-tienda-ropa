import { Op } from 'sequelize';
import { Business } from '../business/business.model.js';
import { Item } from '../items/item.model.js';

export const catalogService = {
  async getById(businessId: string) {
    const business = await Business.findByPk(businessId);
    if (!business) return null;

    const items = await Item.findAll({
      where: { businessId: business.id, visibleInCatalog: true, stock: { [Op.gt]: 0 } },
      order: [['name', 'ASC']],
    });

    return {
      business: { name: business.name, whatsapp: business.catalogWhatsapp },
      // Objeto literal a mano, nunca .toJSON()/spread: así una columna interna
      // (cost, stock, etc.) agregada a Item en el futuro no se filtra por accidente.
      items: items.map((item) => ({ id: item.id, name: item.name, price: item.price })),
    };
  },
};
