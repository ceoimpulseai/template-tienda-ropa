// Ticket storage adapter for @arcasdk/core — manages WSAA access tickets (TA).
// Implements the ITicketStoragePort interface expected by the SDK.
// Single responsibility: cache and validate tickets per service.

import { sequelize } from '../../config/database.js';

export interface AccessTicket {
  token: string;
  sign: string;
  generationTime: string;
  expirationTime: string;
}

// Check real expiration — ticket is expired if expirationTime <= now
function isTicketExpired(ticket: AccessTicket): boolean {
  return new Date(ticket.expirationTime) <= new Date();
}

// Service name format: "wsfe" for electronic billing, or other ARCA WSN
type ServiceName = string;

export const ticketStorage = {
  // Save a ticket to the arca_store table
  async save(ticket: AccessTicket, serviceName: ServiceName): Promise<void> {
    const value = JSON.stringify(ticket);
    await sequelize.query(
      `INSERT INTO arca_store (id, value, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, created_at = CURRENT_TIMESTAMP`,
      { replacements: [serviceName, value] },
    );
  },

  // Get a valid (non-expired) ticket for the given service
  // Returns null if no ticket exists or if the ticket is expired
  async get(serviceName: ServiceName): Promise<AccessTicket | null> {
    const [rows] = await sequelize.query(
      'SELECT value FROM arca_store WHERE id = ?',
      { replacements: [serviceName] },
    );
    const row = (rows as any[])[0];
    if (!row) return null;

    const ticket = JSON.parse(row.value) as AccessTicket;

    // Return null if expired — SDK will re-authenticate
    if (isTicketExpired(ticket)) return null;

    // Return ticket with isExpired() and getToken() methods that SDK requires
    // Uses real expiration check so SDK can call it directly
    return Object.assign(ticket, {
      isExpired: () => isTicketExpired(ticket),
      getToken: () => ticket.token,
    });
  },

  // Delete a ticket (used for forced re-auth or cleanup)
  async delete(serviceName: ServiceName): Promise<void> {
    await sequelize.query(
      'DELETE FROM arca_store WHERE id = ?',
      { replacements: [serviceName] },
    );
  },
};