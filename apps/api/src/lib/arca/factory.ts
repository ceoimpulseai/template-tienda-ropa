// Adapter pattern for @arcasdk/core — wraps the SDK behind our app's ArcaService interface.
// Enables multi-tenant: each createClient() makes an ephemeral single-CUIT Arca instance.

import { Arca } from '@arcasdk/core';
import { sequelize } from '../../config/database.js';

// ---- Abstract interface (our contract, independent of SDK) ----

export type ArcaEnvironment = 'testing' | 'production';

export interface IssueInvoiceInput {
  cuit: string;
  salesPoint: number;
  issuerCondition: string;
  customer: {
    cuit?: string | null;
    dni?: string | null;
    vatCondition: string;
  };
  invoice: {
    items: Array<{ name: string; quantity: number; unitPrice: number }>;
  };
  idempotencyKey: string;
}

export type VoucherResultStatus =
  | 'authorized'
  | 'rejected'
  | 'indeterminate'
  | 'conflict';

export interface VoucherResult {
  result: VoucherResultStatus;
  arcaVoucherId: string | null;
  arcaVoucherNumber: number | null;
  emissionCode: string | null;
  emissionMessage: string | null;
  rawResponse?: string;
}

export interface ArcaService {
  issueInvoice(input: IssueInvoiceInput): Promise<VoucherResult>;
}

// ---- ITicketStoragePort for SDK token caching (backed by arca_store table) ----

interface AccessTicket {
  token: string;
  sign: string;
  generationTime: string;
  expirationTime: string;
}

type ArcaServiceName = string;

interface ITicketStoragePort {
  save(ticket: AccessTicket, serviceName: ArcaServiceName): Promise<void>;
  get(serviceName: ArcaServiceName): Promise<AccessTicket | null>;
  delete(serviceName: ArcaServiceName): Promise<void>;
}

const ticketStorage: ITicketStoragePort = {
  async save(ticket: AccessTicket, serviceName: string): Promise<void> {
    const value = JSON.stringify(ticket);
    await sequelize.query(
      `INSERT INTO arca_store (id, value, created_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, created_at = CURRENT_TIMESTAMP`,
      { replacements: [serviceName, value] },
    );
  },

  async get(serviceName: string): Promise<AccessTicket | null> {
    const [rows] = await sequelize.query(
      'SELECT value FROM arca_store WHERE id = ?',
      { replacements: [serviceName] },
    );
    const row = (rows as any[])[0];
    if (!row) return null;
    const ticket = JSON.parse(row.value) as AccessTicket;
    // SDK expects ticket to have isExpired() method - add it
    // Also validate expiration and return null if expired (SDK will re-auth)
    const expired = new Date(ticket.expirationTime) <= new Date();
    if (expired) return null;
    return {
      ...ticket,
      isExpired: () => true,
    };
  },

  async delete(serviceName: string): Promise<void> {
    await sequelize.query(
      'DELETE FROM arca_store WHERE id = ?',
      { replacements: [serviceName] },
    );
  },
};

// ---- SOAP field name constants for ARCA electronic billing ----

const VOUCHER_TYPE: Record<string, number> = {
  'IVA Responsable Inscripto': 1,
  'IVA Responsable No Inscripto': 6,
  'IVA Sujeto Exento': 6,
  'Consumidor Final': 6,
  'Responsable Monotributo': 11,
  'Sujeto No Categorizado': 6,
  'Proveedor del Exterior': 6,
  'Cliente del Exterior': 6,
  'Liberado - Ley 19.640': 6,
  'IVA Responsable Inscripto - Agente de Percepción': 1,
  'Pequeño Contribuyente Eventual': 11,
  'Monotributista Social': 11,
  'Pequeño Contribuyente Eventual Social': 11,
};

function mapIssuerConditionToVoucherType(issuerCondition: string): number {
  return VOUCHER_TYPE[issuerCondition] ?? 6; // default Factura B
}

// ---- IVA ID mapping (AFIP alícuotas) ----

const IVA_ALIQUOTAS: Record<string, { id: number; percentage: number }> = {
  'IVA Responsable Inscripto': { id: 5, percentage: 21 },
  'IVA Responsable No Inscripto': { id: 5, percentage: 21 },
  'IVA Sujeto Exento': { id: 3, percentage: 0 },
  'Consumidor Final': { id: 5, percentage: 21 },
  'Responsable Monotributo': { id: 5, percentage: 21 },
  'Sujeto No Categorizado': { id: 5, percentage: 21 },
  'Proveedor del Exterior': { id: 5, percentage: 21 },
  'Cliente del Exterior': { id: 3, percentage: 0 },
  'Liberado - Ley 19.640': { id: 3, percentage: 0 },
  'IVA Responsable Inscripto - Agente de Percepción': { id: 5, percentage: 21 },
  'Pequeño Contribuyente Eventual': { id: 5, percentage: 21 },
  'Monotributista Social': { id: 5, percentage: 21 },
  'Pequeño Contribuyente Eventual Social': { id: 5, percentage: 21 },
  'Exento': { id: 3, percentage: 0 },
};

function getIvaAliquota(vatCondition: string): { id: number; percentage: number } {
  return IVA_ALIQUOTAS[vatCondition] ?? { id: 5, percentage: 21 };
}

// ---- CondicionIVAReceptorId mapping ----

const IVA_RECEIVER_CONDITION: Record<string, number> = {
  'IVA Responsable Inscripto': 1,
  'IVA Responsable No Inscripto': 4,
  'IVA No Responsable': 4,
  'IVA Sujeto Exento': 4,
  'Consumidor Final': 4,
  'Responsable Monotributo': 4,
  'Sujeto No Categorizado': 4,
  'Proveedor del Exterior': 4,
  'Cliente del Exterior': 4,
  'Liberado - Ley 19.640': 4,
  'IVA Responsable Inscripto - Agente de Percepción': 1,
  'Pequeño Contribuyente Eventual': 4,
  'Monotributista Social': 4,
  'Pequeño Contribuyente Eventual Social': 4,
};

function mapVatConditionToReceiverId(vatCondition: string): number {
  return IVA_RECEIVER_CONDITION[vatCondition] ?? 4;
}

// ---- SDK result mapping ----

function mapSdkResponseToVoucherResult(sdkResult: any): VoucherResult {
  const feDetResp = sdkResult.response?.FeDetResp?.FECAEDetResponse?.[0];
  const feCabResp = sdkResult.response?.FeCabResp;
  const errors = sdkResult.response?.Errors?.Err;

  const resultado = feDetResp?.Resultado || feCabResp?.Resultado || 'O';

  let result: VoucherResultStatus;
  if (resultado === 'A') result = 'authorized';
  else if (resultado === 'R') result = 'rejected';
  else result = 'indeterminate';

  return {
    result,
    arcaVoucherId: feDetResp?.CAE || null,
    arcaVoucherNumber: feDetResp?.CbteDesde || null,
    emissionCode: errors?.[0]?.Code?.toString() || null,
    emissionMessage: errors?.[0]?.Msg || null,
    rawResponse: JSON.stringify(sdkResult.response),
  };
}

// ---- CreateClient factory ----

export interface CreateClientInput {
  cuit: string;
  certPem: string;
  privateKeyPem: string;
  production: boolean;
}

export function createClient(input: CreateClientInput): ArcaService {
  // CJS → ESM interop: Arca may have a default export
  const ArcaConstructor = (Arca as any).default ?? Arca;

  const arca = new ArcaConstructor({
    cuit: parseInt(input.cuit, 10),
    cert: input.certPem,
    key: input.privateKeyPem,
    production: input.production,
    ticketStorage,
  });

  return {
    async issueInvoice(inv: IssueInvoiceInput): Promise<VoucherResult> {
      const cbteTipo = mapIssuerConditionToVoucherType(inv.issuerCondition);

      // Document type: CUIT = 80, DNI = 96
      const docTipo = inv.customer.dni ? 96 : 80;
      const docNro = parseInt(
        inv.customer.cuit?.replace(/\D/g, '') || inv.customer.dni || '0',
        10,
      );

      // Calculate amounts
      let impNeto = inv.invoice.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      // Factura C (tipo 11 - Monotributo) => IVA = 0
      const esFacturaC = cbteTipo === 11;
      // Factura B (tipo 6 - Responsable No Inscripto) => precio IVA incluido
      const esFacturaB = cbteTipo === 6 && !esFacturaC;
      let impIVA = 0;
      let ivaAliquota = { id: 3, percentage: 0 }; // Exento
      let ivaArray: Array<{ Id: number; BaseImp: number; Importe: number }> = [];

      if (esFacturaB) {
        // Factura B: precio incluye IVA => extraer neto
        const ivaFactor = 0.21;
        const ivaId = 5;
        const impNetoConIva = impNeto;
        impNeto = Math.round((impNetoConIva / (1 + ivaFactor)) * 100) / 100;
        impIVA = Math.round((impNetoConIva - impNeto) * 100) / 100;
        ivaAliquota = { id: ivaId, percentage: 21 };
        ivaArray = [
          {
            Id: ivaAliquota.id,
            BaseImp: impNeto,
            Importe: impIVA,
          },
        ];
      } else if (!esFacturaC) {
        // Factura A: IVA según condición del receptor
        ivaAliquota = getIvaAliquota(inv.customer.vatCondition);
        impIVA = Math.round(impNeto * ivaAliquota.percentage * 100) / 10000;
        ivaArray = [
          {
            Id: ivaAliquota.id,
            BaseImp: impNeto,
            Importe: impIVA,
          },
        ];
      }

      const impTotal = Math.round((impNeto + impIVA) * 100) / 100;

      const dto = {
        CantReg: 1,
        PtoVta: inv.salesPoint,
        CbteTipo: cbteTipo,
        Concepto: 1, // 1 = Productos
        DocTipo: docTipo,
        DocNro: docNro,
        CbteFch: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        ImpTotal: impTotal,
        ImpTotConc: 0,
        ImpNeto: impNeto,
        ImpOpEx: 0,
        ImpIVA: impIVA,
        ImpTrib: 0,
        MonId: 'PES',
        MonCotiz: 1,
        CondicionIVAReceptorId: mapVatConditionToReceiverId(
          inv.customer.vatCondition,
        ),
        Iva: ivaArray,
      };

      try {
        const response =
          await arca.electronicBillingService.createNextVoucher(dto);
        return mapSdkResponseToVoucherResult(response);
      } catch (err: any) {
        const safeError = {
          name: err?.name,
          message: err?.message,
          code: err?.code,
          cause: err?.cause instanceof Error ? err.cause.message : undefined,
        };
        let rawResponse: string;
        try {
          rawResponse = JSON.stringify({ error: safeError });
        } catch {
          rawResponse = '{"error": "non-serializable"}';
        }
        return {
          result: 'rejected',
          arcaVoucherId: null,
          arcaVoucherNumber: null,
          emissionCode: err.code || 'SDK_ERROR',
          emissionMessage: err.message || 'Unknown SDK error',
          rawResponse,
        };
      }
    },
  };
}