// EJEMPLO: adaptar a la lógica del rubro concreto.
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { costService } from '../costs/cost.service.js';

export interface DashboardMetrics {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  totalFixedCosts: number;
  salesCount: number;
}

export const metricsService = {
  // Agregación resuelta en el backend (a diferencia de los proyectos originales de
  // referencia, que traían todo el dataset al cliente y calculaban ahí).
  async dashboard(businessId: string): Promise<DashboardMetrics> {
    const [salesRow] = await sequelize.query<{ totalRevenue: string | null; salesCount: string | null }>(
      `SELECT SUM(quantity * "unitPrice") AS "totalRevenue", COUNT(*) AS "salesCount"
       FROM sales WHERE "businessId" = :businessId`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const [purchasesRow] = await sequelize.query<{ totalCost: string | null }>(
      `SELECT SUM(quantity * "unitCost") AS "totalCost"
       FROM purchases WHERE "businessId" = :businessId`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const totalRevenue = Number(salesRow?.totalRevenue ?? 0);
    const totalCost = Number(purchasesRow?.totalCost ?? 0);
    const totalFixedCosts = await costService.totalFixed(businessId);

    return {
      totalRevenue,
      totalCost,
      grossProfit: totalRevenue - totalCost,
      totalFixedCosts,
      salesCount: Number(salesRow?.salesCount ?? 0),
    };
  },
};
