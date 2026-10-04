import { seedUsers } from './users.js';
import { seedBusiness } from './business.js';
import { seedBranches } from './branches.js';
import { seedMembers } from './members.js';
import { seedItems } from './items.js';
import { seedVariants } from './variants.js';
import { seedCustomers } from './customers.js';
import { seedSuppliers } from './suppliers.js';
import { seedEmployees } from './employees.js';
import { seedPurchases } from './purchases.js';
import { seedSales } from './sales.js';
import { seedCosts } from './costs.js';

export async function runSeeds() {
  console.log('=== Starting seed process ===');

  await seedUsers();
  console.log('✓ Users done');

  await seedBusiness();
  console.log('✓ Business done');

  await seedBranches();
  console.log('✓ Branches done');

  await seedMembers();
  console.log('✓ Members done');

  await seedItems();
  console.log('✓ Items done');

  await seedVariants();
  console.log('✓ Variants done');

  await seedCustomers();
  console.log('✓ Customers done');

  await seedSuppliers();
  console.log('✓ Suppliers done');

  await seedEmployees();
  console.log('✓ Employees done');

  await seedPurchases();
  console.log('✓ Purchases done');

  await seedSales();
  console.log('✓ Sales done');

  await seedCosts();
  console.log('✓ Costs done');

  console.log('=== Seed process completed ===');
}