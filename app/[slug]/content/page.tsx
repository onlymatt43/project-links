'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type ContentBlock } from '@/app/api/content/route';

// Sub-component for video blocks — adapts iframe to actual video dimensions
function VideoBlock({ block }: { block: ContentBlock }) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!block.bunny_video_id) return;
    fetch(`/api/video/${block.bunny_video_id}/meta`)
      .then(r => r.json())
      .then(data => { if (data.width && data.height) setDimensions(data); })
      .catch(() => {});
  }, [block.bunny_video_id]);

  const aspectRatio = dimensions ? `${dimensions.width} / ${dimensions.height}` : '16 / 9';

  // URL directe (MP4 ou CDN public)
  if (!block.bunny_video_id && block.link_url) {
    return (
      <div>
        <div className="bg-black w-full">
          <video
            src={block.link_url}
            controls
            playsInline
            className="w-full"
            style={{ display: 'block' }}
          />
        </div>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-2">{block.title}</h2>
          {block.description && (
            <p className="text-zinc-400 text-sm">{block.description}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-black w-full" style={{ aspectRatio }}>
        <iframe
          src={`/api/video/${block.bunny_video_id}`}
          className="w-full h-full"
          allow="accelerometer;gyroscope;encrypted-media;picture-in-picture;"
          allowFullScreen
        />
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2">{block.title}</h2>
        {block.description && (
          <p className="text-zinc-400 text-sm">{block.description}</p>
        )}
      </div>
    </div>
  );
}

// Sub-component for link blocks — affiche un preview Open Graph
function LinkPreviewBlock({ block }: { block: ContentBlock }) {
  const [og, setOg] = useState<{ title: string; description: string; image: string; siteName: string } | null>(null);

  useEffect(() => {
    if (!block.link_url) return;
    fetch(`/api/og?url=${encodeURIComponent(block.link_url)}`)
      .then(r => r.json())
      .then(data => { if (data.image || data.title) setOg(data); })
      .catch(() => {});
  }, [block.link_url]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-2">{block.title}</h2>
      {block.description && (
        <p className="text-zinc-400 text-sm mb-4">{block.description}</p>
      )}
      <a
        href={block.link_url!}
        target="_blank"
        rel="noopener noreferrer"
        className="block border border-zinc-700 rounded-lg overflow-hidden hover:border-zinc-500 transition group"
      >
        {og?.image && (
          <div className="aspect-video bg-zinc-800 overflow-hidden">
            <img
              src={og.image}
              alt={og.title || block.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-4">
          {og?.siteName && (
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{og.siteName}</p>
          )}
          <p className="font-bold text-white group-hover:underline">
            {og?.title || block.link_label || block.link_url}
          </p>
          {og?.description && (
            <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{og.description}</p>
          )}
          <p className="text-zinc-600 text-xs mt-2 truncate">{block.link_url}</p>
        </div>
      </a>
    </div>
  );
}

// Sub-component for gallery blocks — fetches image list from storage API
function GalleryBlock({ block }: { block: ContentBlock }) {
  const [images, setImages] = useState<{ name: string; proxiedUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!block.bunny_image_url) return;
    fetch(`/api/storage/files?folder=${encodeURIComponent(block.bunny_image_url)}`)
      .then(r => r.json())
      .then(data => {
        if (data.images) setImages(data.images);
        else setError('Impossible de charger les images');
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [block.bunny_image_url]);

  // Navigation clavier
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? (i + 1) % images.length : null);
      if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? (i - 1 + images.length) % images.length : null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, images.length]);

  const prev = () => setLightboxIndex(i => i !== null ? (i - 1 + images.length) % images.length : null);
  const next = () => setLightboxIndex(i => i !== null ? (i + 1) % images.length : null);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-2">{block.title}</h2>
      {block.description && (
        <p className="text-zinc-400 text-sm mb-4">{block.description}</p>
      )}
      {loading && <p className="text-zinc-500 text-sm">Chargement des photos...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && images.length === 0 && !error && (
        <p className="text-zinc-500 text-sm">Aucune photo dans ce dossier.</p>
      )}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <button
              key={img.name}
              onClick={() => setLightboxIndex(idx)}
              className="block aspect-square overflow-hidden rounded bg-zinc-800 cursor-pointer"
            >
              <img
                src={img.proxiedUrl}
                alt={img.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Fermer */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white text-3xl font-bold w-10 h-10 flex items-center justify-center hover:text-zinc-300 z-10"
          >
            ×
          </button>

          {/* Compteur */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm opacity-60">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Précédent */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 sm:left-6 text-white text-4xl font-bold w-12 h-12 flex items-center justify-center hover:text-zinc-300 z-10"
          >
            ‹
          </button>

          {/* Image */}
          <img
            src={images[lightboxIndex].proxiedUrl}
            alt={images[lightboxIndex].name}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Suivant */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 sm:right-6 text-white text-4xl font-bold w-12 h-12 flex items-center justify-center hover:text-zinc-300 z-10"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProjectContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  // Check session on mount
  useEffect(() => {
    if (!slug) return;
    checkSession();
  }, [slug]);

  const checkSession = async () => {
    try {
      const res = await fetch(`/api/session/check?slug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setIsAuthenticated(true);
          await loadContent(data.project_id);
        }
      }
    } catch (err) {
      console.error('Session check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContent = async (projectId: number) => {
    try {
      const res = await fetch(`/api/content?project_id=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setBlocks(data.blocks);
      }
    } catch (err) {
      console.error('Failed to load content:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email, license_key: licenseKey }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        // Reload page to get session
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || 'Code invalide');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-8">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
            Accès Protégé
          </h1>
          <p className="text-zinc-400 text-sm mb-6">
            Entrez vos identifiants d&apos;achat
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black border border-zinc-700 rounded px-4 py-3 mb-3 focus:outline-none focus:border-white"
            />

            <input
              type="text"
              placeholder="Code de licence Payhip"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.trim())}
              required
              className="w-full bg-black border border-zinc-700 rounded px-4 py-3 mb-4 focus:outline-none focus:border-white"
            />

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={isLoading || !licenseKey}
              className="w-full bg-white text-black font-bold py-3 rounded uppercase tracking-wide hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {isLoading ? 'Validation...' : 'Valider'}
            </button>
          </form>

          <p className="text-zinc-600 text-xs mt-6 text-center">
            Vous n&apos;avez pas encore activé votre accès?{' '}
            <a href={`https://projects.onlymatt.ca/${slug}`} className="text-white hover:underline">
              Acheter maintenant
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        <header className="py-8 border-b border-zinc-800 mb-8">
          <a href={`https://projects.onlymatt.ca/${slug}`} className="text-zinc-500 text-sm hover:text-white mb-2 inline-block">
            ← Retour
          </a>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            Contenu Exclusif
          </h1>
        </header>

        {blocks.length === 0 ? (
          <p className="text-zinc-500 text-center py-12">Aucun contenu disponible pour le moment.</p>
        ) : (
          <div className="space-y-8">
            {blocks.map((block) => (
              <div key={block.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                {/* Video Block */}
                {block.type === 'video' && (block.bunny_video_id || block.link_url) && (
                  <VideoBlock block={block} />
                )}

                {/* Photo Block */}
                {block.type === 'photo' && block.bunny_image_url && (
                  <div>
                    <img src={`/api/image?url=${encodeURIComponent(block.bunny_image_url)}`} alt={block.title} className="w-full" />
                    <div className="p-6">
                      <h2 className="text-xl font-bold mb-2">{block.title}</h2>
                      {block.description && (
                        <p className="text-zinc-400 text-sm">{block.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Link Block */}
                {block.type === 'link' && block.link_url && (
                  <LinkPreviewBlock block={block} />
                )}

                {/* Text Block */}
                {block.type === 'text' && block.text_content && (
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">{block.title}</h2>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-zinc-300 whitespace-pre-wrap">{block.text_content}</p>
                    </div>
                  </div>
                )}

                {/* Gallery Block */}
                {block.type === 'gallery' && block.bunny_image_url && (
                  <GalleryBlock block={block} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
