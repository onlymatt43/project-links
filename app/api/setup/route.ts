import { NextResponse } from 'next/server';
import { getTursoClient } from '@/lib/turso';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const db = getTursoClient();

    // Créer la table projects
    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        wp_url TEXT NOT NULL,
        payhip_url TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}
