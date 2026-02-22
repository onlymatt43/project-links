import { NextResponse } from 'next/server';
import { getTursoClient } from '@/lib/turso';

export interface ContentBlock {
  id: number;
  project_id: number;
  type: 'video' | 'photo' | 'link' | 'text';
  title: string;
  description: string | null;
  bunny_video_id: string | null;
  bunny_image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  text_content: string | null;
  order_index: number;
  active: number;
}

/**
 * GET /api/content?project_id=X
 * Récupère tous les blocs de contenu actifs pour un projet
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing project_id' },
        { status: 400 }
      );
    }

    const db = getTursoClient();
    const result = await db.execute({
      sql: `SELECT * FROM project_content 
            WHERE project_id = ? AND active = 1 
            ORDER BY order_index ASC, id ASC`,
      args: [parseInt(projectId)],
    });

    return NextResponse.json({ blocks: result.rows });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
