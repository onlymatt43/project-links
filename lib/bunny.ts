// Utilitaires Bunny.net pour signed URLs
// Formules identiques à super-videotheque-api

import { createHash } from 'crypto';

/**
 * Génère une URL embed signée pour Bunny Stream
 * Formule: SHA256_HEX(signing_key + video_id + expiration)
 * Ref: https://docs.bunny.net/docs/stream-embed-token-authentication
 */
export function generateSignedPlaybackUrl(
  videoId: string,
  expiresInSeconds: number = 3600
): string {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const signingKey = process.env.BUNNY_SIGNING_KEY;

  if (!libraryId || !signingKey) {
    throw new Error('BUNNY_LIBRARY_ID and BUNNY_SIGNING_KEY must be set');
  }

  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // Embed token: SHA256_HEX(signing_key + video_id + expiration)
  const payload = `${signingKey}${videoId}${expires}`;
  const token = createHash('sha256').update(payload).digest('hex');

  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;
}

/**
 * Génère une URL signée pour CDN Bunny (images/thumbnails)
 * Formule: Base64Encode(SHA256_RAW(security_key + path + expiration))
 * Ref: https://docs.bunny.net/docs/cdn-token-authentication
 */
export function generateSignedCdnUrl(
  path: string,
  expiresInSeconds: number = 3600,
  overrideHost?: string
): string {
  const hostname = overrideHost || process.env.BUNNY_PULL_ZONE_HOST;
  const tokenKey = process.env.BUNNY_SIGNING_KEY;

  if (!hostname) {
    throw new Error('BUNNY_PULL_ZONE_HOST must be set');
  }

  if (!tokenKey) {
    return `https://${hostname}/${path}`;
  }

  const now = Math.floor(Date.now() / 1000);
  const windowSize = 300; // stabilise le token sur des fenêtres de 5 min
  const expires = Math.floor((now + expiresInSeconds) / windowSize) * windowSize;
  const signedPath = path.startsWith('/') ? path : `/${path}`;

  // CDN token: Base64Encode(SHA256_RAW(signing_key + path + expiration))
  const hashBuffer = createHash('sha256')
    .update(`${tokenKey}${signedPath}${expires}`)
    .digest();

  const token = hashBuffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `https://${hostname}${signedPath}?token=${token}&expires=${expires}`;
}

/**
 * Cache buster pour images publiques
 */
export function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}
