import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/auth';
import { getProjectBySlug } from '@/lib/projects';

/**
 * GET /api/session/check?slug=PROJECT_SLUG
 * Vérifie si la session est valide pour ce projet
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    // Récupérer le projet
    const project = await getProjectBySlug(slug);
    if (!project) {
      return NextResponse.json({ valid: false }, { status: 404 });
    }

    // Récupérer session ID depuis cookies
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
      return NextResponse.json({ valid: false });
    }

    // IP du client
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Valider session
    const session = await validateSession(sessionId, ip);

    if (!session || session.project_id !== project.id) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ 
      valid: true,
      project_id: project.id,
      email: session.email,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
