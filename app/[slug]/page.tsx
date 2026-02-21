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
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={project.wp_url}
            className="flex-1 bg-white text-black py-4 px-8 rounded-lg font-bold text-center uppercase tracking-wide hover:bg-zinc-200 transition-colors"
          >
            Découvrir le projet
          </a>
          
          {project.payhip_url && (
            <a
              href={project.payhip_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-white text-white py-4 px-8 rounded-lg font-bold text-center uppercase tracking-wide hover:bg-white hover:text-black transition-colors"
            >
              Acheter
            </a>
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
