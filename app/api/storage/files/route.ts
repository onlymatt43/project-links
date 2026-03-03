import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/auth';

/**
 * GET /api/storage/files?folder=/path/to/folder
 * Liste les fichiers images dans un dossier Bunny Storage
 * Requiert une session valide
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const session = await validateSession(sessionId, ip);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || '/';

    const storageZone = 'private-photo';
    const storageHost = 'ny.storage.bunnycdn.com';
    const apiKey = process.env.BUNNY_STORAGE_API_KEY;
    const pullZoneHost = process.env.BUNNY_STORAGE_HOST;

    if (!apiKey || !pullZoneHost) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    // Normaliser le chemin du dossier
    const normalizedFolder = folder.startsWith('/') ? folder : `/${folder}`;
    const folderPath = normalizedFolder.endsWith('/') ? normalizedFolder : `${normalizedFolder}/`;

    const url = `https://${storageHost}/${storageZone}${folderPath}`;

    const res = await fetch(url, {
      headers: {
        AccessKey: apiKey,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Bunny Storage error: ${res.status}` },
        { status: res.status }
      );
    }

    const items = await res.json();

    // Filtrer seulement les images + générer URLs CDN (signées via /api/image)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
    const images = items
      .filter((item: { IsDirectory: boolean; ObjectName: string }) => {
        if (item.IsDirectory) return false;
        const ext = item.ObjectName.toLowerCase().split('.').pop();
        return imageExtensions.some(e => e === `.${ext}`);
      })
      .map((item: { ObjectName: string }) => {
        const cdnUrl = `https://${pullZoneHost}${folderPath}${item.ObjectName}`;
        return {
          name: item.ObjectName,
          url: cdnUrl,
          proxiedUrl: `/api/image?url=${encodeURIComponent(cdnUrl)}`,
        };
      });

    return NextResponse.json({ images, folder: folderPath });

  } catch (error) {
    console.error('Storage files error:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}
