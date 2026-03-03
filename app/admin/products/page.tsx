'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Product {
  id: number;
  project_id: number;
  payhip_product_id: string;
  product_name: string;
  duration_hours: number;
  active: number;
  created_at: string;
}

interface Project {
  id: number;
  slug: string;
  title: string;
}

export default function AdminProductsPage({ searchParams }: { searchParams: Promise<{ project_id?: string }> }) {
  const params = use(searchParams);
  const projectId = params.project_id;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [project, setProject] = useState<Project | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    payhip_product_id: '',
    product_name: '',
    duration_hours: 1,
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('admin-token', password);
        loadProducts();
        loadProject();
      } else {
        setError('Mot de passe incorrect');
      }
    } catch {
      setError('Erreur de connexion');
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('admin-token');
    if (savedToken) {
      setPassword(savedToken);
      setIsAuthenticated(true);
      loadProducts();
      loadProject();
    }
  }, [projectId]);

  const loadProducts = async () => {
    if (!projectId) return;
    
    try {
      const res = await fetch(`/api/admin/products?project_id=${projectId}`, {
        headers: { 'x-admin-password': password || localStorage.getItem('admin-token') || '' },
      });

      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      }
    } catch {
      setError('Erreur de chargement');
    }
  };

  const loadProject = async () => {
    if (!projectId) return;

    try {
      const res = await fetch('/api/admin/projects', {
        headers: { 'x-admin-password': password || localStorage.getItem('admin-token') || '' },
      });

      if (res.ok) {
        const data = await res.json();
        const foundProject = data.projects.find((p: Project) => p.id === parseInt(projectId));
        if (foundProject) {
          setProject(foundProject);
        }
      }
    } catch {
      setError('Erreur de chargement projet');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/admin/products?id=${editingId}`
        : '/api/admin/products';

      const payload = editingId
        ? formData
        : { ...formData, project_id: parseInt(projectId!) };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(editingId ? 'Pass modifié !' : 'Pass créé !');
        setFormData({ payhip_product_id: '', product_name: '', duration_hours: 1 });
        setEditingId(null);
        loadProducts();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      payhip_product_id: product.payhip_product_id,
      product_name: product.product_name,
      duration_hours: product.duration_hours,
    });
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce pass ?')) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });

      if (res.ok) {
        setSuccess('Pass supprimé');
        loadProducts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Erreur de suppression');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/admin/products?id=${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ active: product.active ? 0 : 1 }),
      });

      if (res.ok) {
        loadProducts();
      }
    } catch {
      setError('Erreur de modification');
    }
  };

  const formatDuration = (hours: number): string => {
    if (hours < 24) return `${hours}h`;
    if (hours < 168) return `${hours / 24} jour${hours / 24 > 1 ? 's' : ''}`;
    if (hours < 720) return `${hours / 168} semaine${hours / 168 > 1 ? 's' : ''}`;
    return `${Math.round(hours / 720)} mois`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-8">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-6">Admin Login</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full bg-black border border-zinc-700 rounded px-4 py-3 mb-4 focus:outline-none focus:border-white"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-white text-black font-bold py-3 rounded uppercase tracking-wide hover:bg-zinc-200 transition"
          >
            Login
          </button>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500">Aucun projet sélectionné</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-zinc-500 hover:text-white text-sm mb-2 inline-block">
              ← Retour projets
            </Link>
            <h1 className="text-4xl font-black uppercase tracking-tight">
              Passes{project ? ` - ${project.title}` : ''}
            </h1>
          </div>
        </div>

        {/* Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold uppercase mb-4">
            {editingId ? 'Modifier pass' : 'Nouveau pass'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm text-zinc-400 mb-1">Nom du pass</label>
              <input
                type="text"
                required
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                placeholder="Pass 1 mois"
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Payhip Product ID</label>
                <input
                  type="text"
                  required
                  value={formData.payhip_product_id}
                  onChange={(e) => setFormData({ ...formData, payhip_product_id: e.target.value })}
                  placeholder="MbWth"
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Durée (heures)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
                  placeholder="720"
                  className="w-full bg-black border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-white"
                />
                <p className="text-xs text-zinc-600 mt-1">
                  1h = 1 | 1 jour = 24 | 1 semaine = 168 | 1 mois = 720
                </p>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-white text-black font-bold py-3 rounded uppercase tracking-wide hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {isLoading ? 'Enregistrement...' : editingId ? 'Modifier' : 'Créer'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ payhip_product_id: '', product_name: '', duration_hours: 1 });
                  }}
                  className="px-6 bg-zinc-800 font-bold rounded uppercase hover:bg-zinc-700 transition"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Products List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold uppercase mb-4">Passes configurés ({products.length})</h2>

          {products.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">Aucun pass créé</p>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-black border border-zinc-800 rounded p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold">{product.product_name}</h3>
                      <span className="text-xs bg-zinc-800 px-2 py-1 rounded">
                        {formatDuration(product.duration_hours)}
                      </span>
                      {!product.active && (
                        <span className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded">
                          Désactivé
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                      Product ID: {product.payhip_product_id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className="px-4 py-2 bg-zinc-800 rounded text-sm hover:bg-zinc-700 transition"
                    >
                      {product.active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="px-4 py-2 bg-zinc-800 rounded text-sm hover:bg-zinc-700 transition"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-4 py-2 bg-red-900 rounded text-sm hover:bg-red-800 transition"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
