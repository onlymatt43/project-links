import { NextResponse } from 'next/server';
import { getTursoClient } from '@/lib/turso';

// Middleware to check admin password
function checkAuth(request: Request): boolean {
  const password = request.headers.get('x-admin-password');
  return password === process.env.ADMIN_PASSWORD;
}

// GET - List all projects (including inactive)
export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getTursoClient();
    const result = await db.execute('SELECT * FROM projects ORDER BY created_at DESC');
    
    return NextResponse.json({ projects: result.rows });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST - Create new project
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug, title, description, image_url, wp_url, payhip_url } = await request.json();
    
    const db = getTursoClient();
    await db.execute({
      sql: `INSERT INTO projects (slug, title, description, image_url, wp_url, payhip_url) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [slug, title, description, image_url, wp_url, payhip_url],
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating project:', error);
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// PUT - Update project
export async function PUT(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const body = await request.json();
    const db = getTursoClient();

    // Build dynamic UPDATE query
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(body)) {
      if (['slug', 'title', 'description', 'image_url', 'wp_url', 'payhip_url', 'active'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    
    values.push(id);
    
    await db.execute({
      sql: `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
      args: values,
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating project:', error);
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE - Delete project
export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const db = getTursoClient();
    await db.execute({
      sql: 'DELETE FROM projects WHERE id = ?',
      args: [id],
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
