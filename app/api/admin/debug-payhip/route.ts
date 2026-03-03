import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

function checkAuth(request: Request): boolean {
  const password = request.headers.get('x-admin-password');
  return password === process.env.ADMIN_PASSWORD;
}

// GET /api/admin/debug-payhip?license_key=XXXX
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const licenseKey = searchParams.get('license_key');

  if (!licenseKey) {
    return NextResponse.json({ error: 'license_key required' }, { status: 400 });
  }

  const apiKey = process.env.PAYHIP_API_KEY;
  const baseUrl = process.env.PAYHIP_API_BASE_URL || 'https://payhip.com/api/v2';

  try {
    const response = await axios.get(`${baseUrl}/license/verify`, {
      headers: { 'payhip-api-key': apiKey },
      params: { license_key: licenseKey },
    });
    return NextResponse.json({ raw: response.data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, response: error.response?.data }, { status: 500 });
  }
}
