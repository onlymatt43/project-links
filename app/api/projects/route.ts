import { NextRequest, NextResponse } from 'next/server';
import { getProjectBySlug } from '@/lib/projects';

/**
 * GET /api/projects?slug=xxx
 * Récupère les informations d'un projet
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'slug parameter required' },
        { status: 400 }
      );
    }

    const project = await getProjectBySlug(slug);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });

  } catch (error: any) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project' },
      { status: 500 }
    );
  }
}
