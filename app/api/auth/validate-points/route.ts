import { NextRequest, NextResponse } from 'next/server';
import { getProjectBySlug } from '@/lib/projects';
import { getTursoClient } from '@/lib/turso';

/**
 * Validation d'accès avec système de POINTS
 * 
 * Flow:
 * 1. User entre son email (Google Auth depuis boutique)
 * 2. On appelle auth-payment-system pour dépenser les points requis
 * 3. auth-payment-system retourne la durée de session calculée
 * 4. On crée la session dans project-links avec cette durée
 * 
 * Gestion des erreurs:
 * - 402: Solde insuffisant → Redirige vers boutique
 * - 404: User pas trouvé → Invite à acheter des points
 */

export async function POST(request: NextRequest) {
  try {
    const { slug, email } = await request.json();

    if (!slug || !email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    // ========================================
    // 1. RÉCUPÉRER LE PROJET
    // ========================================

    const project = await getProjectBySlug(slug);
    if (!project) {
      return NextResponse.json(
        { error: 'Projet introuvable' },
        { status: 404 }
      );
    }

    const db = getTursoClient();
    const emailLower = email.toLowerCase();

    // ========================================
    // 2. APPEL API POINTS SYSTEM
    // ========================================

    const authSystemUrl = process.env.AUTH_SYSTEM_URL;
    const authApiKey = process.env.AUTH_API_KEY;

    if (!authSystemUrl || !authApiKey) {
      console.error('Points system not configured');
      return NextResponse.json(
        { error: 'Système de points non configuré' },
        { status: 500 }
      );
    }

    // Appel API pour dépenser les points
    const spendResponse = await fetch(`${authSystemUrl}/api/points/spend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': authApiKey,
      },
      body: JSON.stringify({
        email: emailLower,
        project_slug: slug,
      }),
    });

    if (!spendResponse.ok) {
      const errorData = await spendResponse.json();
      
      if (spendResponse.status === 402) {
        // Insufficient points
        return NextResponse.json(
          {
            error: 'Solde insuffisant',
            required_points: errorData.required_points,
            current_balance: errorData.current_balance,
            shop_url: `${authSystemUrl}/shop`,
          },
          { status: 402 }
        );
      }

      if (spendResponse.status === 404) {
        // User not found
        return NextResponse.json(
          {
            error: 'Aucun compte trouvé avec cet email',
            shop_url: `${authSystemUrl}/shop`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: errorData.error || 'Erreur système de points' },
        { status: spendResponse.status }
      );
    }

    const spendData = await spendResponse.json();

    // ========================================
    // 3. CRÉER/METTRE À JOUR ACCESS CODE
    // ========================================

    await db.execute({
      sql: `INSERT INTO access_codes (project_id, email, license_key, created_at)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(project_id, email) 
            DO UPDATE SET license_key = ?, created_at = datetime('now')`,
      args: [project.id, emailLower, 'POINTS_SYSTEM', 'POINTS_SYSTEM'],
    });

    // ========================================
    // 4. CRÉER SESSION AVEC DURÉE CALCULÉE
    // ========================================

    const sessionId = crypto.randomUUID();
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    
    // Utiliser la durée retournée par l'API points
    const durationMinutes = spendData.session.duration_minutes;
    const sessionDurationMs = durationMinutes * 60 * 1000;
    const cookieMaxAge = durationMinutes * 60;
    const expiresAt = new Date(Date.now() + sessionDurationMs).toISOString();

    await db.execute({
      sql: `INSERT INTO sessions (id, project_id, email, ip_address, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      args: [sessionId, project.id, emailLower, clientIp, expiresAt],
    });

    // ========================================
    // 5. SET SESSION COOKIE
    // ========================================

    const response = NextResponse.json({ 
      success: true,
      points_spent: spendData.points_spent,
      balance_remaining: spendData.balance_remaining,
      duration_minutes: durationMinutes,
      expires_at: spendData.session.expires_at,
    });
    
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge,
    });

    return response;
    
  } catch (error) {
    console.error('Points validation error:', error);
    return NextResponse.json(
      { error: 'Erreur de validation' },
      { status: 500 }
    );
  }
}
