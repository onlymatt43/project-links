import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/video/[videoId]/meta
 * Retourne les dimensions du vidéo depuis Bunny Stream API
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_API_KEY;

  if (!libraryId || !apiKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      {
        headers: { AccessKey: apiKey },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Video not found' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(
      { width: data.width || 1920, height: data.height || 1080 },
      { headers: { 'Cache-Control': 'public, max-age=3600' } }
    );
  } catch {
    return NextResponse.json({ width: 1920, height: 1080 });
  }
}
