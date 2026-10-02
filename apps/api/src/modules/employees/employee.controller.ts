import type { Request, Response, NextFunction } from 'express';
import { employeeService } from './employee.service.js';
import { createEmployeeSchema, updateEmployeeSchema } from '@template/shared';

export const employeeController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const withSchedules = req.query.withSchedules === 'true';
      const result = withSchedules
        ? await employeeService.listWithSchedules(req.auth!.businessId!)
        : await employeeService.list(req.auth!.businessId!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.getById(req.auth!.businessId!, req.params.id!);
      if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }
      res.json(employee);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createEmployeeSchema.parse(req.body);
      const employee = await employeeService.create(req.auth!.businessId!, input);
      res.status(201).json(employee);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateEmployeeSchema.parse(req.body);
      const employee = await employeeService.update(req.auth!.businessId!, req.params.id!, input);
      res.json(employee);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await employeeService.remove(req.auth!.businessId!, req.params.id!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },

  async getSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query;
      if (!from || !to) {
        res.status(400).json({ error: 'from and to query parameters required' });
        return;
      }
      const result = await employeeService.getSchedulesByDateRange(
        req.auth!.businessId!,
        from as string,
        to as string
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};