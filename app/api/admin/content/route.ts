import { NextResponse } from 'next/server';
import { getTursoClient } from '@/lib/turso';

// Middleware auth
function checkAuth(request: Request): boolean {
  const password = request.headers.get('x-admin-password');
  return password === process.env.ADMIN_PASSWORD;
}

// GET - List blocks for a project
export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing project_id' }, { status: 400 });
    }

    const db = getTursoClient();
    const result = await db.execute({
      sql: 'SELECT * FROM project_content WHERE project_id = ? ORDER BY order_index ASC, id ASC',
      args: [parseInt(projectId)],
    });

    return NextResponse.json({ blocks: result.rows });
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json({ error: 'Failed to fetch blocks' }, { status: 500 });
  }
}

// POST - Create block
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      project_id,
      type,
      title,
      description,
      bunny_video_id,
      bunny_image_url,
      link_url,
      link_label,
      text_content,
      order_index,
    } = body;

    const db = getTursoClient();
    await db.execute({
      sql: `INSERT INTO project_content 
            (project_id, type, title, description, bunny_video_id, bunny_image_url, link_url, link_label, text_content, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        project_id,
        type,
        title,
        description || null,
        bunny_video_id || null,
        bunny_image_url || null,
        link_url || null,
        link_label || null,
        text_content || null,
        order_index || 0,
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating block:', error);
    return NextResponse.json({ error: 'Failed to create block' }, { status: 500 });
  }
}

// PUT - Update block
export async function PUT(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const body = await request.json();
    const db = getTursoClient();

    // Build dynamic UPDATE
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (['type', 'title', 'description', 'bunny_video_id', 'bunny_image_url', 'link_url', 'link_label', 'text_content', 'order_index', 'active'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);

    await db.execute({
      sql: `UPDATE project_content SET ${fields.join(', ')} WHERE id = ?`,
      args: values,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating block:', error);
    return NextResponse.json({ error: 'Failed to update block' }, { status: 500 });
  }
}

// DELETE - Delete block
export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const db = getTursoClient();
    await db.execute({
      sql: 'DELETE FROM project_content WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting block:', error);
    return NextResponse.json({ error: 'Failed to delete block' }, { status: 500 });
  }
}
