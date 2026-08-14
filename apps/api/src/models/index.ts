import { Business } from '../modules/business/business.model.js';
import { Branch } from '../modules/branches/branch.model.js';
import { BusinessMember } from '../modules/team/team.model.js';
import { Customer } from '../modules/customers/customer.model.js';
import { Item } from '../modules/items/item.model.js';
import { Purchase } from '../modules/_example/purchases/purchase.model.js';
import { Sale } from '../modules/_example/sales/sale.model.js';
import { Cost } from '../modules/_example/costs/cost.model.js';

Business.hasMany(Branch, { foreignKey: 'businessId' });
Branch.belongsTo(Business, { foreignKey: 'businessId' });

Business.hasMany(BusinessMember, { foreignKey: 'businessId' });
BusinessMember.belongsTo(Business, { foreignKey: 'businessId' });

Business.hasMany(Item, { foreignKey: 'businessId' });
Item.belongsTo(Business, { foreignKey: 'businessId' });

Business.hasMany(Purchase, { foreignKey: 'businessId' });
Item.hasMany(Purchase, { foreignKey: 'itemId' });
Branch.hasMany(Purchase, { foreignKey: 'branchId' });

Business.hasMany(Customer, { foreignKey: 'businessId' });
Customer.belongsTo(Business, { foreignKey: 'businessId' });

Business.hasMany(Sale, { foreignKey: 'businessId' });
Item.hasMany(Sale, { foreignKey: 'itemId' });
Branch.hasMany(Sale, { foreignKey: 'branchId' });
Customer.hasMany(Sale, { foreignKey: 'customerId' });

Business.hasMany(Cost, { foreignKey: 'businessId' });

export { Business, Branch, BusinessMember, Customer, Item, Purchase, Sale, Cost };
