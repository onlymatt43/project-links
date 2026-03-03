import { NextResponse } from 'next/server';
import { getTursoClient } from '@/lib/turso';

// Middleware to check admin password
function checkAuth(request: Request): boolean {
  const password = request.headers.get('x-admin-password');
  return password === process.env.ADMIN_PASSWORD;
}

// GET - List all products for a project
export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id required' }, { status: 400 });
    }

    const db = getTursoClient();
    const result = await db.execute({
      sql: 'SELECT * FROM project_products WHERE project_id = ? ORDER BY duration_hours ASC',
      args: [projectId],
    });
    
    return NextResponse.json({ products: result.rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Create new product/pass
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { project_id, payhip_product_id, product_name, duration_hours } = await request.json();
    
    if (!project_id || !payhip_product_id || !product_name || !duration_hours) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getTursoClient();
    await db.execute({
      sql: `INSERT INTO project_products (project_id, payhip_product_id, product_name, duration_hours) 
            VALUES (?, ?, ?, ?)`,
      args: [project_id, payhip_product_id, product_name, duration_hours],
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    if (error && typeof error === 'object' && 'message' in error) {
      const errMessage = (error as { message: string }).message;
      if (errMessage?.includes('UNIQUE constraint')) {
        return NextResponse.json({ error: 'Ce Product ID existe déjà' }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// PUT - Update product
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
    const fields: string[] = [];
    const values: (string | number)[] = [];
    
    for (const [key, value] of Object.entries(body)) {
      if (['payhip_product_id', 'product_name', 'duration_hours', 'active'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value as string | number);
      }
    }
    
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    
    values.push(id);
    
    await db.execute({
      sql: `UPDATE project_products SET ${fields.join(', ')} WHERE id = ?`,
      args: values,
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error updating product:', error);
    if (error && typeof error === 'object' && 'message' in error) {
      const errMessage = (error as { message: string }).message;
      if (errMessage?.includes('UNIQUE constraint')) {
        return NextResponse.json({ error: 'Ce Product ID existe déjà' }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE - Delete product
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
      sql: 'DELETE FROM project_products WHERE id = ?',
      args: [id],
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
