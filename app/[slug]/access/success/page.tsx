'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessContent({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [slug, setSlug] = useState<string>('');
  const [countdown, setCountdown] = useState(5);

  const pointsSpent = searchParams.get('points');
  const duration = searchParams.get('duration');
  const balance = searchParams.get('balance');

  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    // Countdown before redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/${slug}/content`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [slug, router]);

  const handleNow = () => {
    if (slug) {
      router.push(`/${slug}/content`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Accès accordé!</h1>
        
        <div className="mb-6">
          <p className="text-zinc-400 mb-2">Points dépensés</p>
          <p className="text-4xl font-bold text-red-400">-{pointsSpent} pts</p>
        </div>

        <div className="bg-zinc-800 rounded-lg p-4 mb-6 space-y-3">
          <div>
            <p className="text-sm text-zinc-400">Durée d&apos;accès</p>
            <p className="text-2xl font-bold text-blue-400">{duration} minutes</p>
          </div>
          
          <div className="border-t border-zinc-700 pt-3">
            <p className="text-sm text-zinc-400">Solde restant</p>
            <p className="text-xl font-bold">{balance} points</p>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-300">
            ⏱️ Votre session expire dans {duration} minutes
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleNow}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Accéder maintenant
          </button>
          
          <p className="text-sm text-zinc-500">
            Redirection automatique dans {countdown}s...
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800">
          <a
            href={process.env.NEXT_PUBLIC_AUTH_SYSTEM_URL ? `${process.env.NEXT_PUBLIC_AUTH_SYSTEM_URL}/account` : 'http://localhost:3001/account'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white text-sm transition"
          >
            📊 Voir mon historique
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    }>
      <SuccessContent params={params} />
    </Suspense>
  );
}
