import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../../config/auth.js';
import { authController } from './auth.controller.js';

export const authRoutes = Router();

// Protege login/registro/etc. contra fuerza bruta.
const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
authRoutes.use(authRateLimit);

// Registro self-service con provisioning de negocio (no es el endpoint nativo de better-auth).
authRoutes.post('/register', express.json(), authController.register);

// El resto de operaciones (login, logout, sesión) las maneja better-auth directamente.
authRoutes.all('/*', toNodeHandler(auth));
