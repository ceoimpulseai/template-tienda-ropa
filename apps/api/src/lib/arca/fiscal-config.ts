// Centralized fiscal configuration for ARCA electronic billing.
// Single source of truth for all AFIP/ARCA mappings.
// Adding a new fiscal condition only requires updating this file.

export interface FiscalConditionConfig {
  // AFIP voucher type (tipo de comprobante)
  // 1 = Factura A, 6 = Factura B, 11 = Factura C
  voucherType: number;

  // IVA alícuota for receiver (CondicionIVAReceptorId)
  // 1 = IVA Responsable Inscripto, 4 = Otros
  ivaReceiverId: number;

  // IVA alícuota for items (Iva.Id + percentage)
  // id: AFIP alícuota ID (3 = 0%, 4 = 10.5%, 5 = 21%, etc.)
  // percentage: IVA percentage
  ivaAliquot: { id: number; percentage: number };

  // Whether this condition implies "precio con IVA incluido" (Factura B behavior)
  // Only 'IVA Responsable No Inscripto' (and derived) use this
  priceIncludesVat: boolean;
}

// Complete mapping of all AFIP/ARCA fiscal conditions
export const FISCAL_CONDITIONS: Record<string, FiscalConditionConfig> = {
  'IVA Responsable Inscripto': {
    voucherType: 1,           // Factura A
    ivaReceiverId: 1,         // Responsable Inscripto
    ivaAliquot: { id: 5, percentage: 21 }, // 21%
    priceIncludesVat: false,
  },
  'IVA Responsable No Inscripto': {
    voucherType: 6,           // Factura B
    ivaReceiverId: 4,         // No Responsable
    ivaAliquot: { id: 5, percentage: 21 }, // 21%
    priceIncludesVat: true,   // Factura B: precio incluye IVA
  },
  'IVA No Responsable': {
    voucherType: 6,           // Factura B
    ivaReceiverId: 4,
    ivaAliquot: { id: 5, percentage: 21 }, // 21%
    priceIncludesVat: false,  // Pero se factura como B
  },
  'IVA Sujeto Exento': {
    voucherType: 6,           // Factura B
    ivaReceiverId: 4,
    ivaAliquot: { id: 3, percentage: 0 },  // 0% (exento)
    priceIncludesVat: false,
  },
  'Consumidor Final': {
    voucherType: 6,           // Factura B
    ivaReceiverId: 4,
    ivaAliquot: { id: 5, percentage: 21 }, // 21%
    priceIncludesVat: false,
  },
  'Responsable Monotributo': {
    voucherType: 11,          // Factura C
    ivaReceiverId: 4,
    ivaAliquot: { id: 5, percentage: 21 }, // Se ignora para Factura C
    priceIncludesVat: false,
  },
  'Sujeto No Categorizado': {
    voucherType: 6,           // Factura B
    ivaReceiverId: 4,
    ivaAliquot: { id: 5, percentage: 21 },
    priceIncludesVat: false,
  },
  'Proveedor del Exterior': {
    voucherType: 6,           // Factura B
    ivaReceiverId: 4,
    ivaAliquot: { id: 5, percentage: 21 },
    priceIncludesVat: false,
  },
  'Cliente del Exterior': {
    voucherType: 6,           // Factura B
    ivaReceiverId: 4,
    ivaAliquot: { id: 3, percentage: 0 },  // 0% exportación
    priceIncludesVat: false,
  },
  'Liberado - Ley 19.640': {
    voucherType: 6,           // Factura B
    ivaReceiverId: 4,
    ivaAliquot: { id: 3, percentage: 0 },  // 0% zona franca
    priceIncludesVat: false,
  },
  'IVA Responsable Inscripto - Agente de Percepción': {
    voucherType: 1,           // Factura A
    ivaReceiverId: 1,
    ivaAliquot: { id: 5, percentage: 21 },
    priceIncludesVat: false,
  },
  'Pequeño Contribuyente Eventual': {
    voucherType: 11,          // Factura C
    ivaReceiverId: 4,
    ivaAliquot: { id: 5, percentage: 21 },
    priceIncludesVat: false,
  },
  'Monotributista Social': {
    voucherType: 11,          // Factura C
    ivaReceiverId: 4,
    ivaAliquot: { id: 5, percentage: 21 },
    priceIncludesVat: false,
  },
  'Pequeño Contribuyente Eventual Social': {
    voucherType: 11,          // Factura C
    ivaReceiverId: 4,
    ivaAliquot: { id: 5, percentage: 21 },
    priceIncludesVat: false,
  },
  // Fallback for unknown conditions (legacy 'Exento')
  'Exento': {
    voucherType: 6,
    ivaReceiverId: 4,
    ivaAliquot: { id: 3, percentage: 0 },
    priceIncludesVat: false,
  },
} as const;

export type FiscalCondition = keyof typeof FISCAL_CONDITIONS;

/**
 * Get fiscal configuration for a given issuer/receiver condition.
 * Returns default (Factura B, 21%) if condition not found.
 */
export function getFiscalConfig(condition: string): FiscalConditionConfig {
  return FISCAL_CONDITIONS[condition] ?? FISCAL_CONDITIONS['Consumidor Final'];
}

/**
 * Map issuer condition to AFIP voucher type (cbteTipo).
 * 1 = Factura A, 6 = Factura B, 11 = Factura C
 */
export function getVoucherType(issuerCondition: string): number {
  return getFiscalConfig(issuerCondition).voucherType;
}

/**
 * Map receiver VAT condition to AFIP CondicionIVAReceptorId.
 * 1 = Responsable Inscripto, 4 = Otros
 */
export function getIvaReceiverId(vatCondition: string): number {
  return getFiscalConfig(vatCondition).ivaReceiverId;
}

/**
 * Get IVA alícuota for items (Iva.Id + percentage).
 * For Factura C (Monotributo), returns 0% regardless.
 */
export function getIvaAliquot(vatCondition: string, isFacturaC: boolean): { id: number; percentage: number } {
  if (isFacturaC) return { id: 3, percentage: 0 };
  return getFiscalConfig(vatCondition).ivaAliquot;
}

/**
 * Check if a voucher type implies "precio con IVA incluido" (Factura B behavior).
 */
export function priceIncludesVat(issuerCondition: string): boolean {
  return getFiscalConfig(issuerCondition).priceIncludesVat;
}

/**
 * Get all valid fiscal conditions (for UI dropdowns, validation, etc.)
 */
export function getAllFiscalConditions(): string[] {
  return Object.keys(FISCAL_CONDITIONS);
}

/**
 * Validate if a condition is known.
 */
export function isValidFiscalCondition(condition: string): boolean {
  return condition in FISCAL_CONDITIONS;
}