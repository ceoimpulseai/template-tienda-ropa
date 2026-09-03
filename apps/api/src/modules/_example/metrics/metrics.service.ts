// EJEMPLO: adaptar a la lógica del rubro concreto.
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../../config/database.js';

export interface DashboardMetrics {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number | null;
  totalFixedCosts: number;
  totalVariableCosts: number;
  totalExtraordinaryCosts: number;
  netProfit: number;
  netMarginPercent: number | null;
  breakEvenRevenue: number | null;
  salesCount: number;
}

export const metricsService = {
  // Agregación resuelta en el backend (a diferencia de los proyectos originales de
  // referencia, que traían todo el dataset al cliente y calculaban ahí).
  async dashboard(businessId: string): Promise<DashboardMetrics> {
    const [salesRow] = await sequelize.query<{ totalRevenue: string | null; salesCount: string | null }>(
      `SELECT SUM("amountReceived") AS "totalRevenue", COUNT(*) AS "salesCount"
       FROM sales WHERE "businessId" = :businessId AND "isInternal" = false`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const [purchasesRow] = await sequelize.query<{ totalCost: string | null }>(
      `SELECT SUM(quantity * "unitCost") AS "totalCost"
       FROM purchases WHERE "businessId" = :businessId`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const costRows = await sequelize.query<{ type: string; total: string | null }>(
      `SELECT type, SUM(amount) AS "total"
       FROM costs WHERE "businessId" = :businessId GROUP BY type`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const totalRevenue = Number(salesRow?.totalRevenue ?? 0);
    const totalCost = Number(purchasesRow?.totalCost ?? 0);
    const grossProfit = totalRevenue - totalCost;

    const costMap: Record<string, number> = {};
    for (const row of costRows) {
      costMap[row.type] = Number(row.total ?? 0);
    }

    const totalFixedCosts = costMap['fixed'] ?? 0;
    const totalVariableCosts = costMap['variable'] ?? 0;
    const totalExtraordinaryCosts = costMap['extraordinary'] ?? 0;

    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : null;
    const netProfit = grossProfit - totalFixedCosts - totalVariableCosts - totalExtraordinaryCosts;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : null;
    const breakEvenRevenue =
      grossMarginPercent !== null && grossMarginPercent !== 0
        ? totalFixedCosts / (grossMarginPercent / 100)
        : null;

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      grossMarginPercent,
      totalFixedCosts,
      totalVariableCosts,
      totalExtraordinaryCosts,
      netProfit,
      netMarginPercent,
      breakEvenRevenue,
      salesCount: Number(salesRow?.salesCount ?? 0),
    };
  },
};
