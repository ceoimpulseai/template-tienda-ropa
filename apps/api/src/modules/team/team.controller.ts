import type { Request, Response, NextFunction } from 'express';
import { teamService } from './team.service.js';
import { inviteMemberSchema } from '@template/shared';

export const teamController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await teamService.list(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },

  async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const input = inviteMemberSchema.parse(req.body);
      const member = await teamService.invite(req.auth!.businessId!, input);
      res.status(201).json(member);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await teamService.remove(req.auth!.businessId!, req.params.id!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
