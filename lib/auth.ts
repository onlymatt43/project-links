// Bibliothèque d'authentification et de gestion des sessions
// Adapté de super-videotheque-api (système simple avec codes Payhip)

import { getTursoClient } from './turso';

export interface AccessCode {
  id: number;
  project_id: number;
  email: string;
  license_key: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  project_id: number;
  email: string;
  ip_address: string;
  created_at: string;
  expires_at: string;
}

/**
 * Valide une session existante (vérifie IP + expiration)
 */
export async function validateSession(
  sessionId: string,
  ipAddress: string
): Promise<Session | null> {
  const db = getTursoClient();

  const result = await db.execute({
    sql: `SELECT * FROM sessions 
          WHERE id = ? 
          AND ip_address = ? 
          AND datetime(expires_at) > datetime('now')`,
    args: [sessionId, ipAddress],
  });

  return result.rows.length > 0 ? (result.rows[0] as unknown as Session) : null;
}

/**
 * Supprime les sessions expirées
 */
export async function cleanExpiredSessions(): Promise<void> {
  const db = getTursoClient();
  
  await db.execute({
    sql: 'DELETE FROM sessions WHERE datetime(expires_at) < datetime("now")',
    args: [],
  });
}
