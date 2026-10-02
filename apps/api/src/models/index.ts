import { Business } from '../modules/business/business.model.js';
import { Branch } from '../modules/branches/branch.model.js';
import { BusinessMember } from '../modules/team/team.model.js';
import { Customer } from '../modules/customers/customer.model.js';
import { Item } from '../modules/items/item.model.js';
import { Supplier } from '../modules/suppliers/supplier.model.js';
import { Purchase } from '../modules/_example/purchases/purchase.model.js';
import { Sale } from '../modules/_example/sales/sale.model.js';
import { Cost } from '../modules/_example/costs/cost.model.js';
import { ArcaVoucher } from '../modules/arca/arca-voucher.model.js';
import { Employee, Schedule } from '../modules/employees/employee.model.js';

Business.hasMany(Branch, { foreignKey: 'businessId' });
Branch.belongsTo(Business, { foreignKey: 'businessId' });

Business.hasMany(BusinessMember, { foreignKey: 'businessId' });
BusinessMember.belongsTo(Business, { foreignKey: 'businessId' });

Business.hasMany(Item, { foreignKey: 'businessId' });
Item.belongsTo(Business, { foreignKey: 'businessId' });

Business.hasMany(Supplier, { foreignKey: 'businessId' });
Supplier.belongsTo(Business, { foreignKey: 'businessId' });

Business.hasMany(Purchase, { foreignKey: 'businessId' });
Item.hasMany(Purchase, { foreignKey: 'itemId' });
Branch.hasMany(Purchase, { foreignKey: 'branchId' });
Supplier.hasMany(Purchase, { foreignKey: 'supplierId' });
Purchase.belongsTo(Supplier, { foreignKey: 'supplierId' });

Business.hasMany(Customer, { foreignKey: 'businessId' });
Customer.belongsTo(Business, { foreignKey: 'businessId' });

Business.hasMany(Sale, { foreignKey: 'businessId' });
Item.hasMany(Sale, { foreignKey: 'itemId' });
Branch.hasMany(Sale, { foreignKey: 'branchId' });
Customer.hasMany(Sale, { foreignKey: 'customerId', as: 'sales' });
Sale.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Sale.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });
Sale.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
Sale.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

Business.hasMany(Cost, { foreignKey: 'businessId' });

Business.hasMany(ArcaVoucher, { foreignKey: 'businessId' });
ArcaVoucher.belongsTo(Business, { foreignKey: 'businessId' });
Sale.hasOne(ArcaVoucher, { foreignKey: 'saleId' });
ArcaVoucher.belongsTo(Sale, { foreignKey: 'saleId' });

Business.hasMany(Employee, { foreignKey: 'businessId' });
Employee.belongsTo(Business, { foreignKey: 'businessId' });

Employee.hasMany(Schedule, { foreignKey: 'employeeId', as: 'schedules' });
Schedule.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

export { Business, Branch, BusinessMember, Customer, Item, Supplier, Purchase, Sale, Cost, ArcaVoucher, Employee, Schedule };
