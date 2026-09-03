// EJEMPLO: adaptar a la lógica del rubro concreto.
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../../config/database.js';
import type { IncomeStatement, BreakEven, ProductMargin, Ratios } from '@template/shared';

export const financialsService = {
  async incomeStatement(businessId: string): Promise<IncomeStatement> {
    const [salesRow] = await sequelize.query<{ revenue: string | null }>(
      `SELECT SUM("amountReceived") AS revenue
       FROM sales WHERE "businessId" = :businessId AND "isInternal" = false`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const [purchasesRow] = await sequelize.query<{ cogs: string | null }>(
      `SELECT SUM(quantity * "unitCost") AS cogs
       FROM purchases WHERE "businessId" = :businessId`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const costRows = await sequelize.query<{ type: string; total: string | null }>(
      `SELECT type, SUM(amount) AS total
       FROM costs WHERE "businessId" = :businessId GROUP BY type`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const revenue = Number(salesRow?.revenue ?? 0);
    const cogs = Number(purchasesRow?.cogs ?? 0);
    const grossProfit = revenue - cogs;
    const grossMarginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : null;

    const costMap: Record<string, number> = {};
    for (const row of costRows) {
      costMap[row.type] = Number(row.total ?? 0);
    }

    const fixedCosts = costMap['fixed'] ?? 0;
    const variableCosts = costMap['variable'] ?? 0;
    const extraordinaryCosts = costMap['extraordinary'] ?? 0;

    const netProfit = grossProfit - fixedCosts - variableCosts - extraordinaryCosts;
    const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : null;

    return {
      revenue,
      cogs,
      grossProfit,
      grossMarginPercent,
      fixedCosts,
      variableCosts,
      extraordinaryCosts,
      netProfit,
      netMarginPercent,
    };
  },

  async breakEven(businessId: string): Promise<BreakEven> {
    const [salesRow] = await sequelize.query<{ totalRevenue: string | null }>(
      `SELECT SUM("amountReceived") AS "totalRevenue"
       FROM sales WHERE "businessId" = :businessId AND "isInternal" = false`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const costRows = await sequelize.query<{ type: string; total: string | null }>(
      `SELECT type, SUM(amount) AS total
       FROM costs WHERE "businessId" = :businessId GROUP BY type`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const costMap: Record<string, number> = {};
    for (const row of costRows) {
      costMap[row.type] = Number(row.total ?? 0);
    }

    const totalRevenue = Number(salesRow?.totalRevenue ?? 0);
    const totalFixedCosts = costMap['fixed'] ?? 0;
    const totalVariableCosts = costMap['variable'] ?? 0;

    const contributionMargin = totalRevenue - totalVariableCosts;
    const contributionMarginRatio = totalRevenue > 0 ? contributionMargin / totalRevenue : null;
    const breakEvenRevenue =
      contributionMarginRatio !== null && contributionMarginRatio > 0
        ? totalFixedCosts / contributionMarginRatio
        : null;

    const [avgPriceRow] = await sequelize.query<{ avgUnitPrice: string | null }>(
      `SELECT AVG("unitPrice") AS "avgUnitPrice"
       FROM sales WHERE "businessId" = :businessId AND "isInternal" = false`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const [avgCostRow] = await sequelize.query<{ avgUnitCost: string | null }>(
      `SELECT AVG("unitCost") AS "avgUnitCost"
       FROM purchases WHERE "businessId" = :businessId`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const avgUnitPrice = Number(avgPriceRow?.avgUnitPrice ?? 0);
    const avgUnitCost = Number(avgCostRow?.avgUnitCost ?? 0);
    const breakEvenUnits =
      avgUnitPrice > 0 && avgUnitCost > 0 && avgUnitPrice > avgUnitCost
        ? totalFixedCosts / (avgUnitPrice - avgUnitCost)
        : null;

    return {
      totalFixedCosts,
      totalVariableCosts,
      totalRevenue,
      contributionMargin,
      contributionMarginRatio,
      breakEvenRevenue,
      breakEvenUnits,
    };
  },

  async productMargins(businessId: string): Promise<ProductMargin[]> {
    const rows = await sequelize.query<{
      id: string;
      name: string;
      price: number;
      avgUnitCost: string | null;
      totalRevenue: string | null;
      totalQty: string | null;
    }>(
      `SELECT i.id, i.name, i.price,
        COALESCE((SELECT AVG(p."unitCost") FROM purchases p WHERE p."itemId" = i.id AND p."businessId" = i."businessId"), null) AS "avgUnitCost",
        COALESCE((SELECT SUM(s."amountReceived") FROM sales s WHERE s."itemId" = i.id AND s."businessId" = i."businessId" AND s."isInternal" = false), 0) AS "totalRevenue",
        COALESCE((SELECT SUM(s.quantity) FROM sales s WHERE s."itemId" = i.id AND s."businessId" = i."businessId" AND s."isInternal" = false), 0) AS "totalQty"
       FROM items i WHERE i."businessId" = :businessId`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    return rows.map((row) => {
      const avgUnitCost = row.avgUnitCost !== null ? Number(row.avgUnitCost) : null;
      const marginDollars = avgUnitCost !== null ? row.price - avgUnitCost : null;
      const marginPercent =
        avgUnitCost !== null && avgUnitCost > 0
          ? ((row.price - avgUnitCost) / row.price) * 100
          : null;

      return {
        itemId: row.id,
        itemName: row.name,
        unitPrice: row.price,
        avgUnitCost,
        marginDollars,
        marginPercent,
      };
    });
  },

  async ratios(businessId: string): Promise<Ratios> {
    const [salesRow] = await sequelize.query<{ revenue: string | null; salesCount: string | null }>(
      `SELECT SUM("amountReceived") AS revenue, COUNT(*) AS "salesCount"
       FROM sales WHERE "businessId" = :businessId AND "isInternal" = false`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const [purchasesRow] = await sequelize.query<{ cogs: string | null }>(
      `SELECT SUM(quantity * "unitCost") AS cogs
       FROM purchases WHERE "businessId" = :businessId`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const costRows = await sequelize.query<{ type: string; total: string | null }>(
      `SELECT type, SUM(amount) AS total
       FROM costs WHERE "businessId" = :businessId GROUP BY type`,
      { replacements: { businessId }, type: QueryTypes.SELECT },
    );

    const revenue = Number(salesRow?.revenue ?? 0);
    const cogs = Number(purchasesRow?.cogs ?? 0);
    const salesCount = Number(salesRow?.salesCount ?? 0);

    const costMap: Record<string, number> = {};
    for (const row of costRows) {
      costMap[row.type] = Number(row.total ?? 0);
    }

    const fixedCosts = costMap['fixed'] ?? 0;
    const variableCosts = costMap['variable'] ?? 0;
    const extraordinaryCosts = costMap['extraordinary'] ?? 0;

    const grossProfit = revenue - cogs;
    const grossMarginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : null;
    const netProfit = grossProfit - fixedCosts - variableCosts - extraordinaryCosts;
    const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : null;
    const operatingExpenseRatio =
      revenue > 0 ? ((fixedCosts + variableCosts) / revenue) * 100 : null;
    const profitPerSale = salesCount > 0 ? netProfit / salesCount : null;
    const costToRevenueRatio =
      revenue > 0
        ? ((cogs + fixedCosts + variableCosts + extraordinaryCosts) / revenue) * 100
        : null;

    return {
      grossMarginPercent,
      netMarginPercent,
      operatingExpenseRatio,
      profitPerSale,
      costToRevenueRatio,
    };
  },
};