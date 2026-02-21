import { getAllProjects } from '@/lib/projects';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  let projects = [];
  let error = null;

  try {
    projects = await getAllProjects();
  } catch (e) {
    error = e;
    console.error('Error loading projects:', e);
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="py-12 text-center">
          <h1 className="font-black text-5xl md:text-6xl tracking-tight uppercase">
            Projets
          </h1>
          <p className="mt-4 text-zinc-400 text-lg">
            Découvrez mes créations
          </p>
        </header>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-zinc-500">
              Initialisation requise. Configurez Turso et appelez{' '}
              <code className="text-white bg-zinc-800 px-2 py-1 rounded">
                /api/setup
              </code>
            </p>
          </div>
        )}

        {/* Project Grid */}
        {!error && projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-500">Aucun projet pour le moment.</p>
          </div>
        )}

        {!error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/${project.slug}`}
                className="group bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all"
              >
                {/* Image */}
                {project.image_url && (
                  <div className="relative w-full aspect-video bg-zinc-800">
                    <Image
                      src={project.image_url}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <h2 className="font-bold text-xl uppercase tracking-wide group-hover:text-zinc-300 transition-colors">
                    {project.title}
                  </h2>
                  {project.description && (
                    <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="py-12 text-center text-sm text-zinc-600">
          <p>© {new Date().getFullYear()} OnlyMatt</p>
        </footer>
      </div>
    </main>
  );
}
