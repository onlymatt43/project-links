import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/auth';

/**
 * GET /api/image?url=<bunny_image_url>
 * Pour les images privées Bunny Storage : proxy direct via Storage API (AccessKey).
 * Pour les images publiques : redirection directe.
 */
export async function GET(request: NextRequest) {
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

    const rawIp = request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  'unknown';
    const ip = rawIp.split(',')[0].trim();

    const session = await validateSession(sessionId, ip);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const storageHost = process.env.BUNNY_STORAGE_HOST;
    const storageApiKey = process.env.BUNNY_STORAGE_API_KEY;
    const storageZone = 'private-photo';
    const storageRegion = 'ny.storage.bunnycdn.com';

    // Image privée Bunny → proxy via Storage API
    if (storageHost && imageUrl.includes(storageHost)) {
      if (!storageApiKey) {
        return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
      }

      // Extraire le chemin : /sur/photo.jpg → https://ny.storage.bunnycdn.com/private-photo/sur/photo.jpg
      const url = new URL(imageUrl);
      const storageFetchUrl = `https://${storageRegion}/${storageZone}${url.pathname}`;

      const bunnyRes = await fetch(storageFetchUrl, {
        headers: { AccessKey: storageApiKey },
      });

      if (!bunnyRes.ok) {
        return NextResponse.json(
          { error: `Storage fetch failed: ${bunnyRes.status}` },
          { status: bunnyRes.status }
        );
      }

      const contentType = bunnyRes.headers.get('content-type') || 'image/jpeg';
      const buffer = await bunnyRes.arrayBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    }

    // Image publique → redirection directe
    return NextResponse.redirect(imageUrl);

  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}

