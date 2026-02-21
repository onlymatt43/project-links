import { createClient } from '@libsql/client';

let client: ReturnType<typeof createClient> | null = null;

export function getTursoClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
    }

    client = createClient({
      url,
      authToken,
      intMode: 'number', // Évite les problèmes avec BigInt
    });
  }

  return client;
}
