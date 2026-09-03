// Tipos para el módulo de financials. Reflejan los Zod schemas de shared.
export interface IncomeStatement {
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number | null;
  fixedCosts: number;
  variableCosts: number;
  extraordinaryCosts: number;
  netProfit: number;
  netMarginPercent: number | null;
}

export interface BreakEven {
  totalFixedCosts: number;
  totalVariableCosts: number;
  totalRevenue: number;
  contributionMargin: number;
  contributionMarginRatio: number | null;
  breakEvenRevenue: number | null;
  breakEvenUnits: number | null;
}

export interface ProductMargin {
  itemId: string;
  itemName: string;
  unitPrice: number;
  avgUnitCost: number | null;
  marginDollars: number | null;
  marginPercent: number | null;
}

export type ProductMargins = ProductMargin[];

export interface Ratios {
  grossMarginPercent: number | null;
  netMarginPercent: number | null;
  operatingExpenseRatio: number | null;
  profitPerSale: number | null;
  costToRevenueRatio: number | null;
}