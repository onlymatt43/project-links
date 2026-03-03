import { NextRequest, NextResponse } from 'next/server';
import { getTursoClient } from '@/lib/turso';

/**
 * POST /api/admin/preview
 * Crée une session admin temporaire pour prévisualiser le contenu d'un projet
 */
export async function POST(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { project_id } = await request.json();
    if (!project_id) {
      return NextResponse.json({ error: 'project_id required' }, { status: 400 });
    }

    const db = getTursoClient();

    // Récupérer le slug du projet
    const projectResult = await db.execute({
      sql: 'SELECT id, slug FROM projects WHERE id = ?',
      args: [project_id],
    });

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
    }

    const project = projectResult.rows[0];
    const slug = project.slug as string;

    // Créer une session admin 24h
    const sessionId = crypto.randomUUID();
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.execute({
      sql: `INSERT INTO sessions (id, project_id, email, ip_address, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      args: [sessionId, project.id, 'admin@preview.local', clientIp, expiresAt],
    });

    const response = NextResponse.json({ success: true, slug });
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Preview session error:', error);
    return NextResponse.json({ error: 'Failed to create preview session' }, { status: 500 });
  }
}
