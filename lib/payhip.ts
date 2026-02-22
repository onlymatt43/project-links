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
        'payhip-api-key': apiKey,
      },
      params: {
        license_key: licenseKey,
      },
    });

    if (response.data && response.data.status === 'success') {
      const license: PayhipLicense = response.data.data;

      // Si product ID spécifié, vérifier qu'il correspond
      if (expectedProductId && license.product_id !== expectedProductId) {
        console.warn(`License for wrong product: expected ${expectedProductId}, got ${license.product_id}`);
        return null;
      }

      return license;
    }

    return null;
  } catch (error: any) {
    console.error('Payhip validation error:', error.message);
    return null;
  }
}
