import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/og?url=<url>
 * Fetch Open Graph metadata from a URL (title, description, image)
 * Côté serveur pour éviter les blocages CORS
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OnlyMattBot/1.0)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 400 });
    }

    const html = await res.text();

    const getMeta = (property: string): string => {
      // og: property
      const ogMatch = html.match(
        new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
      ) || html.match(
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i')
      );
      if (ogMatch) return ogMatch[1];

      // name= fallback
      const nameMap: Record<string, string> = {
        'og:title': 'title',
        'og:description': 'description',
      };
      if (nameMap[property]) {
        const nameMatch = html.match(
          new RegExp(`<meta[^>]+name=["']${nameMap[property]}["'][^>]+content=["']([^"']+)["']`, 'i')
        ) || html.match(
          new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${nameMap[property]}["']`, 'i')
        );
        if (nameMatch) return nameMatch[1];
      }

      return '';
    };

    // <title> fallback
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const ogImage = getMeta('og:image');
    const ogTitle = getMeta('og:title') || (titleTag ? titleTag[1].trim() : '');
    const ogDescription = getMeta('og:description');
    const siteName = getMeta('og:site_name');

    // Résoudre les URLs relatives pour og:image
    let resolvedImage = ogImage;
    if (ogImage && ogImage.startsWith('/')) {
      const base = new URL(url);
      resolvedImage = `${base.origin}${ogImage}`;
    }

    return NextResponse.json(
      { title: ogTitle, description: ogDescription, image: resolvedImage, siteName },
      {
        headers: { 'Cache-Control': 'public, max-age=3600' },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to fetch OG data' }, { status: 500 });
  }
}
