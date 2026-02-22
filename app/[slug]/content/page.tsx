'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type ContentBlock } from '@/app/api/content/route';

// Force dynamic rendering pour cette page protégée
export const dynamic = 'force-dynamic';

export default function ProjectContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [totp, setTotp] = useState('');
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
      const res = await fetch('/api/access/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email, totp }),
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
            Entrez votre code Google Authenticator
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
              placeholder="Code TOTP (6 chiffres)"
              value={totp}
              onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              className="w-full bg-black border border-zinc-700 rounded px-4 py-3 mb-4 focus:outline-none focus:border-white text-center text-2xl tracking-widest"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={isLoading || totp.length !== 6}
              className="w-full bg-white text-black font-bold py-3 rounded uppercase tracking-wide hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {isLoading ? 'Validation...' : 'Valider'}
            </button>
          </form>

          <p className="text-zinc-600 text-xs mt-6 text-center">
            Vous n'avez pas encore activé votre accès?{' '}
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
                {block.type === 'video' && block.bunny_video_id && (
                  <div>
                    <div className="aspect-video bg-black">
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
                )}

                {/* Photo Block */}
                {block.type === 'photo' && block.bunny_image_url && (
                  <div>
                    <img src={block.bunny_image_url} alt={block.title} className="w-full" />
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
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-2">{block.title}</h2>
                    {block.description && (
                      <p className="text-zinc-400 text-sm mb-4">{block.description}</p>
                    )}
                    <a
                      href={block.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-white text-black px-6 py-3 rounded font-bold hover:bg-zinc-200 transition"
                    >
                      {block.link_label || 'Voir →'}
                    </a>
                  </div>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
