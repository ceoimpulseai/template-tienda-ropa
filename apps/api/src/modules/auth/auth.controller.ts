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
      const { headers, ...result } = await authService.registerBusinessOwner(input);
      const setCookie = headers.getSetCookie?.() ?? [];
      if (setCookie.length > 0) res.setHeader('set-cookie', setCookie);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
};
