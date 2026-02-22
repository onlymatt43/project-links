import { getTursoClient } from './turso';

export interface Project {
  id: number;
  slug: string;
  title: string;
  description: string;
  image_url: string;
  payhip_url?: string;
  payhip_product_id?: string;
  active: number;
  created_at: string;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const db = getTursoClient();
  
  const result = await db.execute({
    sql: `SELECT id, slug, title, description, image_url, payhip_url, payhip_product_id, active, created_at 
          FROM projects WHERE slug = ? AND active = 1`,
    args: [slug],
  });

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as unknown as Project;
}

export async function getAllProjects(): Promise<Project[]> {
  const db = getTursoClient();
  
  const result = await db.execute({
    sql: `SELECT id, slug, title, description, image_url, payhip_url, payhip_product_id, active, created_at 
          FROM projects WHERE active = 1 ORDER BY created_at DESC`,
    args: [],
  });

  return result.rows as unknown as Project[];
}
