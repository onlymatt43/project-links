// Utilitaires Bunny.net pour signed URLs
// Adapté de super-videotheque-api

import { createHmac } from 'crypto';

/**
 * Génère une URL signée pour lecture vidéo Bunny Stream
 * @param videoId - ID de la vidéo Bunny Stream
 * @param expiresInSeconds - Durée de validité (défaut: 3600 = 1h)
 */
export function generateSignedPlaybackUrl(
  videoId: string,
  expiresInSeconds: number = 3600
): string {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_API_KEY;

  if (!libraryId || !apiKey) {
    throw new Error('BUNNY_LIBRARY_ID and BUNNY_API_KEY must be set');
  }

  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  
  // Bunny Stream signed URL format
  const toSign = `${libraryId}${apiKey}${expires}${videoId}`;
  const signature = createHmac('sha256', apiKey).update(toSign).digest('hex');

  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${signature}&expires=${expires}`;
}

/**
 * Génère une URL signée pour CDN Bunny (images)
 * Note: Si ton CDN n'a pas de token authentication, retourne juste l'URL
 */
export function generateSignedCdnUrl(
  path: string,
  expiresInSeconds: number = 3600
): string {
  const hostname = process.env.BUNNY_PULL_ZONE_HOST;
  const tokenKey = process.env.BUNNY_SIGNING_KEY;

  if (!hostname) {
    throw new Error('BUNNY_PULL_ZONE_HOST must be set');
  }

  // Si pas de token key configuré, retourner URL publique
  if (!tokenKey) {
    return `https://${hostname}/${path}`;
  }

  // Sinon, générer token signé
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const pathToSign = `/${path}`;
  
  const hashableBase = `${tokenKey}${pathToSign}${expires}`;
  const token = createHmac('sha256', tokenKey)
    .update(hashableBase)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `https://${hostname}${pathToSign}?token=${token}&expires=${expires}`;
}

/**
 * Cache buster pour images publiques
 */
export function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}
