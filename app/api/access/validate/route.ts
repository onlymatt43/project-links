import { NextResponse } from 'next/server';
import { getProjectBySlug } from '@/lib/projects';
import { getAccessCode, validateTOTP, createSession } from '@/lib/auth';

/**
 * POST /api/access/validate
 * Body: { slug, email, totp }
 * Valide le code TOTP et crée une session
 */
export async function POST(request: Request) {
  try {
    const { slug, email, totp } = await request.json();

    if (!slug || !email || !totp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Récupérer le projet
    const project = await getProjectBySlug(slug);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Récupérer le code d'accès
    const accessCode = await getAccessCode(project.id, email);
    if (!accessCode) {
      return NextResponse.json(
        { error: 'No access code found for this email' },
        { status: 404 }
      );
    }

    // Valider le TOTP
    const isValid = validateTOTP(accessCode.totp_secret, totp);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid code' },
        { status: 401 }
      );
    }

    // IP et User-Agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent');

    // Créer session
    const session = await createSession(project.id, email, ip, userAgent);

    // Retourner session ID dans un cookie
    const response = NextResponse.json({ 
      success: true,
      sessionId: session.id,
    });

    response.cookies.set('session_id', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.SESSION_DURATION_HOURS || '24') * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}
