// Ticket storage adapter for @arcasdk/core — manages WSAA access tickets (TA).
// Implements the full ITicketStoragePort interface expected by the SDK.
// Single responsibility: cache and validate tickets per service.
// Thread-safe: uses per-service mutex to prevent concurrent login attempts.

import { sequelize } from '../../config/database.js';

export interface AccessTicket {
  token: string;
  sign: string;
  generationTime: string;
  expirationTime: string;
}

// Extended ticket with all methods the SDK expects
export interface SdkTicket extends AccessTicket {
  isExpired: () => boolean;
  getToken: () => string;
  getSign: () => string;
  getExpirationTime: () => Date;
  getGenerationTime: () => Date;
}

// Check real expiration — ticket is expired if expirationTime <= now
function isTicketExpired(ticket: AccessTicket): boolean {
  try {
    return new Date(ticket.expirationTime) <= new Date();
  } catch {
    return true; // invalid date = treat as expired
  }
}

// Service name format: "wsfe" for electronic billing, or other ARCA WSN
type ServiceName = string;

// Per-service mutex to prevent concurrent login attempts
const serviceMutexes = new Map<ServiceName, Promise<void>>();

async function withMutex<T>(serviceName: ServiceName, fn: () => Promise<T>): Promise<T> {
  // Get or create mutex for this service
  let release: (value: void | PromiseLike<void>) => void;
  const mutexPromise = new Promise<void>((resolve) => { release = resolve; });
  
  const existingMutex = serviceMutexes.get(serviceName);
  if (existingMutex) {
    // Wait for existing operation to complete
    await existingMutex;
  }
  
  // Set new mutex
  serviceMutexes.set(serviceName, mutexPromise);
  
  try {
    return await fn();
  } finally {
    // Release mutex
    release();
    serviceMutexes.delete(serviceName);
  }
}

export const ticketStorage = {
  // Save a ticket to the arca_store table
  async save(ticket: AccessTicket, serviceName: ServiceName): Promise<void> {
    await withMutex(serviceName, async () => {
      // Ensure we save all fields from the SDK ticket
      const value = JSON.stringify({
        token: ticket.token,
        sign: ticket.sign,
        generationTime: ticket.generationTime,
        expirationTime: ticket.expirationTime,
      });
      await sequelize.query(
        `INSERT INTO arca_store (id, value, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, created_at = CURRENT_TIMESTAMP`,
        { replacements: [serviceName, value] },
      );
    });
  },

  // Get a valid (non-expired) ticket for the given service
  // Returns null if no ticket exists, if expired, or if token/sign are missing
  async get(serviceName: ServiceName): Promise<SdkTicket | null> {
    return withMutex(serviceName, async () => {
      const [rows] = await sequelize.query(
        'SELECT value FROM arca_store WHERE id = ?',
        { replacements: [serviceName] },
      );
      const row = (rows as any[])[0];
      if (!row) return null;

      let ticket: AccessTicket;
      try {
        ticket = JSON.parse(row.value) as AccessTicket;
      } catch {
        // Corrupted data — force re-auth
        return null;
      }

      // Validate required fields exist
      if (!ticket || typeof ticket !== 'object') return null;
      if (!ticket.token || !ticket.sign) return null;
      if (!ticket.generationTime || !ticket.expirationTime) return null;

      // Return null if expired — SDK will re-authenticate
      if (isTicketExpired(ticket)) return null;

      const expirationTime = new Date(ticket.expirationTime);
      const generationTime = new Date(ticket.generationTime);

      // Validate dates are valid
      if (isNaN(expirationTime.getTime()) || isNaN(generationTime.getTime())) return null;

      // Return ticket with ALL methods the SDK expects
      return Object.assign(ticket, {
        isExpired: () => new Date(ticket.expirationTime) <= new Date(),
        getToken: () => ticket.token,
        getSign: () => ticket.sign,
        getExpirationTime: () => expirationTime,
        getGenerationTime: () => generationTime,
      });
    });
  },

  // Delete a ticket (used for forced re-auth or cleanup)
  async delete(serviceName: ServiceName): Promise<void> {
    await withMutex(serviceName, async () => {
      await sequelize.query(
        'DELETE FROM arca_store WHERE id = ?',
        { replacements: [serviceName] },
      );
    });
  },
};