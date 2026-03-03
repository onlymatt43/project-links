import { NextRequest, NextResponse } from 'next/server';
import { getProjectBySlug } from '@/lib/projects';
import { validatePayhipLicense } from '@/lib/payhip';
import { getTursoClient } from '@/lib/turso';

/**
 * Validation d'accès avec système de PASSES multi-durées
 * 
 * Un projet peut avoir plusieurs produits Payhip (passes) avec durées différentes :
 * - Pass 1h → 1 heure de session
 * - Pass 1 jour → 24 heures de session
 * - Pass 1 mois → 720 heures de session
 * 
 * Le système vérifie la license key contre TOUS les produits du projet
 * et crée une session avec la durée du pass acheté.
 */

export async function POST(request: NextRequest) {
  try {
    const { slug, email, license_key } = await request.json();

    if (!slug || !email || !license_key) {
      return NextResponse.json(
        { error: 'Email et code de licence requis' },
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
    // 2. RÉCUPÉRER TOUS LES PASSES DU PROJET
    // ========================================

    const productsResult = await db.execute({
      sql: `SELECT payhip_product_id, payhip_secret_key, product_name, duration_hours 
            FROM project_products 
            WHERE project_id = ? AND active = 1`,
      args: [project.id],
    });

    if (productsResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Aucun pass disponible pour ce projet' },
        { status: 404 }
      );
    }

    // ========================================
    // 3. VALIDER LICENSE KEY CONTRE CHAQUE PASS
    // ========================================

    let validProduct: { payhip_product_id: string; product_name: string; duration_hours: number } | null = null;

    for (const row of productsResult.rows) {
      const productId = row.payhip_product_id as string;
      const productSecretKey = row.payhip_secret_key as string;
      
      // Validate Payhip license pour ce product
      const payhipResult = await validatePayhipLicense(license_key, productId, productSecretKey);

      if (payhipResult !== null) {
        // Vérifier email match
        if (payhipResult.email?.toLowerCase() === emailLower) {
          validProduct = {
            payhip_product_id: productId,
            product_name: row.product_name as string,
            duration_hours: row.duration_hours as number,
          };
          break; // License valide trouvée !
        }
      }
    }

    if (!validProduct) {
      return NextResponse.json(
        { error: 'Code de licence invalide ou email incorrect' },
        { status: 401 }
      );
    }

    // ========================================
    // 4. CRÉER/METTRE À JOUR ACCESS CODE
    // ========================================

    await db.execute({
      sql: `INSERT INTO access_codes (project_id, email, license_key, created_at)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(project_id, email) 
            DO UPDATE SET license_key = ?, created_at = datetime('now')`,
      args: [project.id, emailLower, license_key, license_key],
    });

    // ========================================
    // 5. CRÉER SESSION AVEC DURÉE DU PASS
    // ========================================

    const sessionId = crypto.randomUUID();
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    
    // Utiliser la durée du pass acheté
    const sessionDurationMs = validProduct.duration_hours * 60 * 60 * 1000;
    const cookieMaxAge = validProduct.duration_hours * 60 * 60;
    const expiresAt = new Date(Date.now() + sessionDurationMs).toISOString();

    await db.execute({
      sql: `INSERT INTO sessions (id, project_id, email, ip_address, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      args: [sessionId, project.id, emailLower, clientIp, expiresAt],
    });

    // ========================================
    // 6. SET SESSION COOKIE
    // ========================================

    const response = NextResponse.json({ 
      success: true,
      pass: validProduct.product_name,
      duration_hours: validProduct.duration_hours,
    });
    
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge,
    });

    return response;
    
  } catch (error) {
    console.error('Auth validation error:', error);
    return NextResponse.json(
      { error: 'Erreur de validation' },
      { status: 500 }
    );
  }
}
