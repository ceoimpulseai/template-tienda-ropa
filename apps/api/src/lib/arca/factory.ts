// Adapter pattern for @arcasdk/core — wraps the SDK behind our app's ArcaService interface.
// Enables multi-tenant: each createClient() makes an ephemeral single-CUIT Arca instance.

import { Arca } from '@arcasdk/core';
import { ticketStorage } from './ticket-storage.js';
import {
  getVoucherType,
  getIvaAliquot,
  getIvaReceiverId,
  priceIncludesVat,
} from './fiscal-config.js';

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
      const cbteTipo = getVoucherType(inv.issuerCondition);

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
      // Factura B con precio IVA incluido (solo para condiciones que lo indican)
      const esFacturaB = priceIncludesVat(inv.issuerCondition);
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
        ivaAliquota = getIvaAliquot(inv.customer.vatCondition, false);
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
        CondicionIVAReceptorId: getIvaReceiverId(inv.customer.vatCondition),
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