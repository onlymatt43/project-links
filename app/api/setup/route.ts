import { NextResponse } from 'next/server';
import { getTursoClient } from '@/lib/turso';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const db = getTursoClient();

    // Table projects
    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        wp_url TEXT NOT NULL DEFAULT '',
        payhip_url TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Table project_products (passes multi-durées Payhip)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS project_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        payhip_product_id TEXT NOT NULL,
        payhip_secret_key TEXT,
        product_name TEXT NOT NULL,
        duration_hours INTEGER NOT NULL,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE(payhip_product_id)
      )
    `);

    // Ajouter colonne payhip_secret_key si elle n'existe pas encore
    try {
      await db.execute(`ALTER TABLE project_products ADD COLUMN payhip_secret_key TEXT`);
    } catch {
      // Colonne existe déjà, ignorer
    }

    // Table access_codes (codes Payhip validés)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS access_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        license_key TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE(project_id, email)
      )
    `);

    // Table sessions (sessions IP-bound)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Table project_content (blocs de contenu)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS project_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('video', 'photo', 'link', 'text')),
        title TEXT NOT NULL,
        description TEXT,
        bunny_video_id TEXT,
        bunny_image_url TEXT,
        link_url TEXT,
        link_label TEXT,
        text_content TEXT,
        order_index INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Index
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_access_codes_email ON access_codes(email)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_content_project ON project_content(project_id)`);

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      tables: ['projects', 'project_products', 'access_codes', 'sessions', 'project_content'],
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: String(error) },
      { status: 500 }
    );
  }
}
