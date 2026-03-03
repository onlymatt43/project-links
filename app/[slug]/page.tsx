import { notFound } from 'next/navigation';
import { getProjectBySlug } from '@/lib/projects';
import Image from 'next/image';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Image */}
        {project.image_url && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-zinc-800">
            <Image
              src={project.image_url}
              alt={project.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Titre */}
        <h1 className="font-black text-4xl md:text-5xl tracking-tight uppercase">
          {project.title}
        </h1>

        {/* Description */}
        {project.description && (
          <p className="text-lg text-zinc-400 leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Boutons CTA */}
        <div className="space-y-6">
          {/* System de Points (Nouveau) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">🎯 Système de Points</h3>
                <p className="text-sm text-zinc-400">Nouveau système recommandé</p>
              </div>
              <span className="bg-green-900/30 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
                ACTIF
              </span>
            </div>
            <p className="text-sm text-zinc-300 mb-4">
              Achetez des points une fois, utilisez-les sur tous les projets. Plus flexible et économique.
            </p>
            <a
              href={`/${project.slug}/access`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-bold text-center uppercase tracking-wide transition-colors"
            >
              Accéder avec Points
            </a>
          </div>

          {/* Payhip (Legacy) */}
          {project.payhip_url && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 opacity-75">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">🔑 Code d&apos;accès Payhip</h3>
                  <p className="text-sm text-zinc-400">Ancien système (toujours actif)</p>
                </div>
                <span className="bg-zinc-800 text-zinc-400 text-xs font-semibold px-3 py-1 rounded-full">
                  LEGACY
                </span>
              </div>
              <p className="text-sm text-zinc-300 mb-4">
                Si vous avez déjà acheté un code d&apos;accès Payhip, utilisez cette option.
              </p>
              <div className="flex gap-3">
                <a
                  href={`/${project.slug}/content`}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-6 rounded-lg font-bold text-center uppercase tracking-wide transition-colors"
                >
                  Valider mon code
                </a>
                <a
                  href={project.payhip_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white py-3 px-6 rounded-lg font-bold text-center uppercase tracking-wide transition-colors"
                >
                  Acheter
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-8 text-center text-sm text-zinc-600">
          <a href="/" className="hover:text-zinc-400 transition-colors">
            ← Tous les projets
          </a>
        </div>
      </div>
    </main>
  );
}
