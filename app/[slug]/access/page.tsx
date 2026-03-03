'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserBalance {
  email: string;
  points: number;
  has_account: boolean;
}

export default function AccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectCost, setProjectCost] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug);
      loadProjectInfo(p.slug);
    });
  }, [params]);

  const loadProjectInfo = async (projectSlug: string) => {
    try {
      const res = await fetch(`/api/projects?slug=${projectSlug}`);
      if (res.ok) {
        const data = await res.json();
        setProjectName(data.project.title);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  };

  const loadPointCost = async (projectSlug: string) => {
    try {
      const authSystemUrl = process.env.NEXT_PUBLIC_AUTH_SYSTEM_URL || 'http://localhost:3001';
      const res = await fetch(`${authSystemUrl}/api/points/cost?project_slug=${projectSlug}`);
      if (res.ok) {
        const data = await res.json();
        setProjectCost(data.points_required);
        setEstimatedMinutes(data.estimated_duration_minutes);
      }
    } catch (err) {
      console.error('Failed to load cost:', err);
    }
  };

  useEffect(() => {
    if (slug) {
      loadPointCost(slug);
    }
  }, [slug]);

  // Check balance when email changes
  const checkBalance = async (emailValue: string) => {
    if (!emailValue || !emailValue.includes('@')) {
      setUserBalance(null);
      return;
    }

    setCheckingBalance(true);
    try {
      const authSystemUrl = process.env.NEXT_PUBLIC_AUTH_SYSTEM_URL || 'http://localhost:3001';
      const res = await fetch(`${authSystemUrl}/api/balance/check?email=${encodeURIComponent(emailValue)}`);
      if (res.ok) {
        const data = await res.json();
        setUserBalance(data);
      }
    } catch (err) {
      console.error('Failed to check balance:', err);
    } finally {
      setCheckingBalance(false);
    }
  };

  // Debounce email input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email) {
        checkBalance(email);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/validate-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email }),
      });

      const data = await res.json();

      if (res.ok) {
        // Success! Redirect to confirmation page then content
        router.push(`/${slug}/access/success?points=${data.points_spent}&duration=${data.duration_minutes}&balance=${data.balance_remaining}`);
      } else {
        // Handle errors
        if (res.status === 402) {
          // Insufficient points - handled below
          setError(
            `Solde insuffisant. Vous avez ${data.current_balance} points, il en faut ${data.required_points}.`
          );
        } else if (res.status === 404) {
          // User not found
          setError('Aucun compte trouvé avec cet email.');
        } else {
          setError(data.error || 'Erreur d\'accès');
        }
      }
    } catch (err) {
      setError('Erreur de connexion au système');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const authSystemUrl = process.env.NEXT_PUBLIC_AUTH_SYSTEM_URL || 'http://localhost:3001';
  const insufficientPoints = userBalance && projectCost > 0 && userBalance.points < projectCost;
  const hasEnoughPoints = userBalance && projectCost > 0 && userBalance.points >= projectCost;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-8">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
          {projectName || 'Accès Points'}
        </h1>
        <p className="text-zinc-400 text-sm mb-6">
          Accès via système de points
        </p>

        {projectCost > 0 && (
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-300 mb-1">
              <span className="font-bold text-xl">{projectCost} points</span> requis
            </p>
            <p className="text-xs text-blue-400">
              ≈ {estimatedMinutes} minutes d&apos;accès
            </p>
          </div>
        )}

        {/* Balance Display */}
        {userBalance && (
          <div className={`rounded-lg p-4 mb-6 border ${
            hasEnoughPoints 
              ? 'bg-green-900/20 border-green-800' 
              : insufficientPoints
              ? 'bg-red-900/20 border-red-800'
              : 'bg-zinc-800 border-zinc-700'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 mb-1">Votre solde</p>
                <p className={`text-2xl font-bold ${
                  hasEnoughPoints ? 'text-green-400' : insufficientPoints ? 'text-red-400' : 'text-white'
                }`}>
                  {userBalance.points} pts
                </p>
              </div>
              {hasEnoughPoints && (
                <div className="text-green-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {insufficientPoints && (
                <div className="text-red-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>
            {insufficientPoints && (
              <p className="text-xs text-red-300 mt-2">
                Il vous manque {projectCost - userBalance.points} points
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleAccess} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email (compte Google)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {checkingBalance && (
              <p className="text-xs text-zinc-500 mt-1">Vérification du solde...</p>
            )}
            {!checkingBalance && userBalance && !userBalance.has_account && (
              <p className="text-xs text-yellow-500 mt-1">
                ⚠️ Aucun compte trouvé. Vous devez d&apos;abord acheter des points.
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Insufficient Points - Show Buy Button */}
          {insufficientPoints ? (
            <a
              href={`${authSystemUrl}/shop`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-center transition"
            >
              🛒 Acheter des points ({projectCost - userBalance!.points} pts manquants)
            </a>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !userBalance?.has_account}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition"
            >
              {isLoading ? 'Vérification...' : hasEnoughPoints ? '✓ Accéder' : 'Accéder'}
            </button>
          )}
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
          <p className="text-sm text-zinc-400 mb-2">Pas encore de points?</p>
          <a
            href={`${authSystemUrl}/shop`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
          >
            🛒 Acheter des points
          </a>
        </div>
      </div>
    </div>
  );
}
