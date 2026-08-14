import express, { Router } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../../config/auth.js';
import { authController } from './auth.controller.js';

export const authRoutes = Router();

// Registro self-service con provisioning de negocio (no es el endpoint nativo de better-auth).
authRoutes.post('/register', express.json(), authController.register);

// El resto de operaciones (login, logout, sesión) las maneja better-auth directamente.
authRoutes.all('/*', toNodeHandler(auth));
