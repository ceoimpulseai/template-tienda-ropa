import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service.js';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(1),
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerSchema.parse(req.body);
      const result = await authService.registerBusinessOwner(input);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
};
