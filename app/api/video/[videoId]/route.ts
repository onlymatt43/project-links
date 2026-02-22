import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/auth';
import { generateSignedPlaybackUrl } from '@/lib/bunny';

/**
 * GET /api/video/[videoId]
 * Redirige vers une URL Bunny signée si session valide
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;

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

    // Générer URL signée
    const signedUrl = generateSignedPlaybackUrl(videoId);

    // Rediriger vers l'iframe Bunny
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('Video proxy error:', error);
    return NextResponse.json({ error: 'Failed to load video' }, { status: 500 });
  }
}
