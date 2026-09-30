import type { Request, Response, NextFunction } from 'express';
import { arcaConfigSchema } from '@template/shared';
import { businessService } from '../business/business.service.js';
import { issueInvoice } from '../../lib/arca/invoicing.service.js';
import { sequelize } from '../../config/database.js';
import { NotFoundError } from '../../lib/errors.js';

export const arcaController = {
  // GET /business/arca
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await businessService.getArcaConfig(req.auth!.businessId!);
      res.json(config);
    } catch (err) {
      next(err);
    }
  },

  // PUT /business/arca
  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const input = arcaConfigSchema.parse(req.body);
      const config = await businessService.updateArcaConfig(
        req.auth!.businessId!,
        input,
      );
      res.json(config);
    } catch (err) {
      next(err);
    }
  },

  // POST /sales/:id/issue
  async issue(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'MISSING_SALE_ID' });
      const voucher = await issueInvoice(
        req.auth!.businessId!,
        req.auth!.branchId!,
        id,
      );
      if (voucher.result === 'rejected') {
        res.status(422).json(voucher);
      } else {
        res.json(voucher);
      }
    } catch (err) {
      next(err);
    }
  },

  // GET /sales/:id/arca-voucher
  async getVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'MISSING_SALE_ID' });
      const includeRaw = req.query.includeRaw === 'true';

      const [rows] = await sequelize.query(
        `SELECT * FROM arca_vouchers WHERE "saleId" = ? AND "businessId" = ?`,
        { replacements: [id, req.auth!.businessId!] },
      );
      const voucher = (rows as any[])[0];
      if (!voucher) {
        throw new NotFoundError('ARCA_VOUCHER_NOT_FOUND');
      }

      const response: any = {
        id: voucher.id,
        saleId: voucher.saleId,
        result: voucher.result,
        arcaVoucherId: voucher.arcaVoucherId,
        arcaVoucherNumber: voucher.arcaVoucherNumber,
        emissionCode: voucher.emissionCode,
        emissionMessage: voucher.emissionMessage,
        emittedAt: voucher.emittedAt,
      };
      if (includeRaw) {
        response.rawResponse = voucher.rawResponse;
      }
      res.json(response);
    } catch (err) {
      next(err);
    }
  },
};