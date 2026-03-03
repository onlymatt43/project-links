import { NextRequest, NextResponse } from 'next/server';
import { getTursoClient } from '@/lib/turso';

/**
 * GET /api/points/cost?project_slug=xxx
 * Récupère le coût en points d'un projet
 * (Lookup dans la table project_costs du système auth-payment-system)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectSlug = searchParams.get('project_slug');

    if (!projectSlug) {
      return NextResponse.json(
        { error: 'project_slug parameter required' },
        { status: 400 }
      );
    }

    const db = getTursoClient();

    // Récupérer le coût depuis la table project_costs
    const result = await db.execute({
      sql: 'SELECT points_required FROM project_costs WHERE project_slug = ?',
      args: [projectSlug],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found in points system' },
        { status: 404 }
      );
    }

    const pointsRequired = result.rows[0].points_required as number;

    // Récupérer la valeur temps du point (pour affichage estimé)
    const configResult = await db.execute({
      sql: 'SELECT point_minutes_value FROM point_config WHERE id = 1',
      args: [],
    });

    const minutesPerPoint = configResult.rows[0]?.point_minutes_value as number || 6;
    const estimatedMinutes = pointsRequired * minutesPerPoint;

    return NextResponse.json({
      project_slug: projectSlug,
      points_required: pointsRequired,
      minutes_per_point: minutesPerPoint,
      estimated_duration_minutes: estimatedMinutes,
    });

  } catch (error: any) {
    console.error('Points cost fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch points cost' },
      { status: 500 }
    );
  }
}
