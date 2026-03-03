import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/auth';
import { generateSignedCdnUrl } from '@/lib/bunny';

/**
 * GET /api/image?url=<bunny_image_url>
 * Redirige vers une URL Bunny CDN signée si session valide
 * Pour les images publiques, redirige directement sans signature
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Vérifier session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const session = await validateSession(sessionId, ip);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Si l'URL vient du storage Bunny privé → signer avec BUNNY_STORAGE_SIGNING_KEY
    const storageHost = process.env.BUNNY_STORAGE_HOST;
    const storageSigningKey = process.env.BUNNY_STORAGE_SIGNING_KEY;
    if (storageHost && imageUrl.includes(storageHost)) {
      const url = new URL(imageUrl);
      const signedUrl = generateSignedCdnUrl(url.pathname, 3600, storageHost, storageSigningKey);
      return NextResponse.redirect(signedUrl);
    }

    // Sinon → rediriger directement (URL publique)
    return NextResponse.redirect(imageUrl);

  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}
