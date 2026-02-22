import { NextResponse } from 'next/server';
import { getProjectBySlug } from '@/lib/projects';
import { validatePayhipLicense } from '@/lib/payhip';
import { createOrGetAccessCode, generateTOTPSecret } from '@/lib/auth';
import QRCode from 'qrcode';

/**
 * GET /api/access/qr?code=PAYHIP_LICENSE&slug=PROJECT_SLUG
 * Valide un code Payhip et génère un QR code TOTP
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const slug = searchParams.get('slug');

    if (!code || !slug) {
      return NextResponse.json(
        { error: 'Missing code or slug' },
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

    // Valider la license Payhip
    const license = await validatePayhipLicense(
      code,
      project.payhip_product_id || undefined
    );

    if (!license) {
      return NextResponse.json(
        { error: 'Invalid or expired license' },
        { status: 401 }
      );
    }

    // IP du client
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Créer ou récupérer code d'accès
    const accessCode = await createOrGetAccessCode(
      project.id,
      license.email,
      ip,
      code
    );

    // Générer QR code
    const totpData = generateTOTPSecret(license.email, slug);
    const qrCodeDataUrl = await QRCode.toDataURL(totpData.uri);

    // Retourner page HTML avec QR code
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accès ${project.title} - OnlyMatt</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #000;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 500px;
      text-align: center;
      background: #111;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 40px;
    }
    h1 {
      font-size: 28px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
    }
    .project-title {
      color: #666;
      font-size: 14px;
      margin-bottom: 30px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .qr-box {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      display: inline-block;
      margin: 20px 0;
    }
    .qr-box img {
      display: block;
      max-width: 100%;
      height: auto;
    }
    .instructions {
      color: #999;
      font-size: 14px;
      line-height: 1.6;
      margin: 20px 0;
    }
    .email {
      background: #222;
      padding: 12px;
      border-radius: 6px;
      font-family: monospace;
      color: #0f0;
      margin: 20px 0;
    }
    .btn {
      display: inline-block;
      background: #fff;
      color: #000;
      padding: 14px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 20px;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #ddd;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Accès Activé ✓</h1>
    <div class="project-title">${project.title}</div>
    
    <p class="instructions">
      Scannez ce code QR avec <strong>Google Authenticator</strong> ou toute application TOTP compatible.
    </p>
    
    <div class="qr-box">
      <img src="${qrCodeDataUrl}" alt="QR Code TOTP">
    </div>
    
    <div class="email">${license.email}</div>
    
    <p class="instructions">
      Utilisez les codes générés par l'application pour accéder au contenu.<br>
      Les codes changent toutes les 30 secondes.
    </p>
    
    <a href="https://projects.onlymatt.ca/${slug}/content" class="btn">
      Accéder au Contenu →
    </a>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate access' },
      { status: 500 }
    );
  }
}
