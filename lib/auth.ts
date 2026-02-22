// Bibliothèque d'authentification et de gestion des sessions
// Copié et adapté de super-videotheque-api

import { getTursoClient } from './turso';
import * as OTPAuth from 'otpauth';
import { randomBytes } from 'crypto';

export interface AccessCode {
  id: number;
  project_id: number;
  email: string;
  totp_secret: string;
  payhip_license: string | null;
  ip_address: string | null;
  created_at: string;
  last_used: string | null;
}

export interface Session {
  id: string;
  project_id: number;
  email: string;
  ip_address: string;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
  last_activity: string;
}

/**
 * Génère un secret TOTP et retourne le code QR
 */
export function generateTOTPSecret(email: string, projectSlug: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  
  const totp = new OTPAuth.TOTP({
    issuer: 'OnlyMatt Projects',
    label: `${projectSlug} - ${email}`,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  return {
    secret: secret.base32,
    uri: totp.toString(),
    qrCode: totp.toString(), // Pour générer le QR avec qrcode library
  };
}

/**
 * Valide un code TOTP
 */
export function validateTOTP(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

/**
 * Crée ou récupère un code d'accès pour un projet
 */
export async function createOrGetAccessCode(
  projectId: number,
  email: string,
  ipAddress: string,
  payhipLicense?: string
): Promise<AccessCode> {
  const db = getTursoClient();

  // Vérifier si existe déjà
  const existing = await db.execute({
    sql: 'SELECT * FROM access_codes WHERE project_id = ? AND email = ?',
    args: [projectId, email],
  });

  if (existing.rows.length > 0) {
    // Mettre à jour last_used
    await db.execute({
      sql: 'UPDATE access_codes SET last_used = datetime("now"), ip_address = ? WHERE id = ?',
      args: [ipAddress, existing.rows[0].id],
    });
    return existing.rows[0] as unknown as AccessCode;
  }

  // Créer nouveau
  const { secret } = generateTOTPSecret(email, `project-${projectId}`);

  await db.execute({
    sql: `INSERT INTO access_codes (project_id, email, totp_secret, payhip_license, ip_address)
          VALUES (?, ?, ?, ?, ?)`,
    args: [projectId, email, secret, payhipLicense || null, ipAddress],
  });

  const result = await db.execute({
    sql: 'SELECT * FROM access_codes WHERE project_id = ? AND email = ? ORDER BY id DESC LIMIT 1',
    args: [projectId, email],
  });

  return result.rows[0] as unknown as AccessCode;
}

/**
 * Crée une session utilisateur (IP-bound)
 */
export async function createSession(
  projectId: number,
  email: string,
  ipAddress: string,
  userAgent: string | null
): Promise<Session> {
  const db = getTursoClient();
  const sessionId = randomBytes(32).toString('hex');
  
  const durationHours = parseInt(process.env.SESSION_DURATION_HOURS || '1');
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

  await db.execute({
    sql: `INSERT INTO sessions (id, project_id, email, ip_address, user_agent, expires_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [sessionId, projectId, email, ipAddress, userAgent, expiresAt],
  });

  const result = await db.execute({
    sql: 'SELECT * FROM sessions WHERE id = ?',
    args: [sessionId],
  });

  return result.rows[0] as unknown as Session;
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

  if (result.rows.length === 0) {
    return null;
  }

  // Mettre à jour last_activity
  await db.execute({
    sql: 'UPDATE sessions SET last_activity = datetime("now") WHERE id = ?',
    args: [sessionId],
  });

  return result.rows[0] as unknown as Session;
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

/**
 * Récupère le code d'accès par email et project
 */
export async function getAccessCode(
  projectId: number,
  email: string
): Promise<AccessCode | null> {
  const db = getTursoClient();

  const result = await db.execute({
    sql: 'SELECT * FROM access_codes WHERE project_id = ? AND email = ?',
    args: [projectId, email],
  });

  return result.rows.length > 0 ? (result.rows[0] as unknown as AccessCode) : null;
}
