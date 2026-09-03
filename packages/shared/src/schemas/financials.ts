import { z } from 'zod';

export const incomeStatementSchema = z.object({
  revenue: z.number(),
  cogs: z.number(),
  grossProfit: z.number(),
  grossMarginPercent: z.number().nullable(),
  fixedCosts: z.number(),
  variableCosts: z.number(),
  extraordinaryCosts: z.number(),
  netProfit: z.number(),
  netMarginPercent: z.number().nullable(),
});
export type IncomeStatement = z.infer<typeof incomeStatementSchema>;

export const breakEvenSchema = z.object({
  totalFixedCosts: z.number(),
  totalVariableCosts: z.number(),
  totalRevenue: z.number(),
  contributionMargin: z.number(),
  contributionMarginRatio: z.number().nullable(),
  breakEvenRevenue: z.number().nullable(),
  breakEvenUnits: z.number().nullable(),
});
export type BreakEven = z.infer<typeof breakEvenSchema>;

export const productMarginSchema = z.object({
  itemId: z.string(),
  itemName: z.string(),
  unitPrice: z.number(),
  avgUnitCost: z.number().nullable(),
  marginDollars: z.number().nullable(),
  marginPercent: z.number().nullable(),
});
export type ProductMargin = z.infer<typeof productMarginSchema>;

export const productMarginsSchema = z.array(productMarginSchema);
export type ProductMargins = z.infer<typeof productMarginsSchema>;

export const ratiosSchema = z.object({
  grossMarginPercent: z.number().nullable(),
  netMarginPercent: z.number().nullable(),
  operatingExpenseRatio: z.number().nullable(),
  profitPerSale: z.number().nullable(),
  costToRevenueRatio: z.number().nullable(),
});
export type Ratios = z.infer<typeof ratiosSchema>;