// EJEMPLO: adaptar a la lógica del rubro concreto.
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