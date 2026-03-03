// Service Payhip pour validation des licences
import axios from 'axios';

export interface PayhipLicense {
  product_id: string;
  product_name: string;
  email: string;
  license_key: string;
  sale_date: string;
}

/**
 * Valide une license key Payhip pour un produit spécifique
 */
export async function validatePayhipLicense(
  licenseKey: string,
  expectedProductId?: string
): Promise<PayhipLicense | null> {
  const apiKey = process.env.PAYHIP_API_KEY;
  const baseUrl = process.env.PAYHIP_API_BASE_URL || 'https://payhip.com/api/v2';

  if (!apiKey) {
    throw new Error('PAYHIP_API_KEY must be set');
  }

  try {
    const response = await axios.get(`${baseUrl}/license/verify`, {
      headers: {
        'product-secret-key': apiKey,
      },
      params: {
        license_key: licenseKey,
      },
    });

    const payload = response.data;

    // Réponse vide ou clé introuvable
    if (!payload.data || !payload.data.license_key) {
      return null;
    }

    // Licence désactivée
    if (payload.data.enabled === false) {
      return null;
    }

    // product_link contient le slug Payhip (ex: "MbWth" ou "https://payhip.com/b/MbWth")
    const productLink: string = payload.data.product_link ?? '';
    // Extraire juste le slug de l'URL si nécessaire
    const productSlug = productLink.split('/').pop() ?? productLink;

    // Si product ID spécifié, vérifier qu'il correspond
    if (expectedProductId && productSlug !== expectedProductId) {
      console.warn(`License for wrong product: expected ${expectedProductId}, got ${productSlug}`);
      return null;
    }

    return {
      product_id: productSlug,
      product_name: payload.data.product_name ?? '',
      email: payload.data.buyer_email ?? '',
      license_key: payload.data.license_key,
      sale_date: payload.data.date ?? '',
    };
  } catch (error: any) {
    console.error('Payhip validation error:', error.message);
    return null;
  }
}
