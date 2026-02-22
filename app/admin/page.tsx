'use client';

import { useState, useEffect } from 'react';
import { type Project } from '@/lib/projects';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    image_url: '',
    wp_url: '',
    payhip_url: '',
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
        setError('');
        loadProjects();
      } else {
        setError('Mot de passe incorrect');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/admin/projects', {
        headers: { 'x-admin-password': password },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (err) {
      setError('Erreur de chargement');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = editingId
        ? `/api/admin/projects?id=${editingId}`
        : '/api/admin/projects';
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(editingId ? 'Projet modifié!' : 'Projet créé!');
        resetForm();
        loadProjects();
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce projet?')) return;

    try {
      const res = await fetch(`/api/admin/projects?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });

      if (res.ok) {
        setSuccess('Projet supprimé!');
        loadProjects();
      } else {
        setError('Erreur de suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const handleEdit = (project: Project) => {
    setFormData({
      slug: project.slug,
      title: project.title,
      description: project.description,
      image_url: project.image_url,
      wp_url: project.wp_url,
      payhip_url: project.payhip_url || '',
    });
    setEditingId(project.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleActive = async (id: number, currentActive: number) => {
    try {
      const res = await fetch(`/api/admin/projects?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ active: currentActive === 1 ? 0 : 1 }),
      });

      if (res.ok) {
        setSuccess('Statut modifié!');
        loadProjects();
      }
    } catch (err) {
      setError('Erreur');
    }
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      description: '',
      image_url: '',
      wp_url: '',
      payhip_url: '',
    });
    setEditingId(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-8">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-6">
            Admin
          </h1>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full bg-black border border-zinc-700 rounded px-4 py-3 mb-4 focus:outline-none focus:border-white"
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-white text-black font-bold py-3 rounded uppercase tracking-wide hover:bg-zinc-200 transition"
          >
            Connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tight">
            Gestion des Projets
          </h1>
          <a
            href="https://projects.onlymatt.ca"
            target="_blank"
            className="text-sm text-zinc-400 hover:text-white"
          >
            Voir le site →
          </a>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/20 border border-green-500 text-green-200 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 uppercase">
            {editingId ? 'Modifier le Projet' : 'Nouveau Projet'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Slug (URL)</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="only-surrr"
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Titre</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ONLY SURRR"
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-zinc-400 mb-1">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du projet..."
              rows={3}
              className="w-full bg-black border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-white"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm text-zinc-400 mb-1">URL Image (Bunny CDN)</label>
            <input
              type="url"
              required
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://onlymatt-media.b-cdn.net/..."
              className="w-full bg-black border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Page WordPress</label>
              <input
                type="url"
                required
                value={formData.wp_url}
                onChange={(e) => setFormData({ ...formData, wp_url: e.target.value })}
                placeholder="https://onlymatt.ca/projet"
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Lien Payhip</label>
              <input
                type="url"
                required
                value={formData.payhip_url}
                onChange={(e) => setFormData({ ...formData, payhip_url: e.target.value })}
                placeholder="https://payhip.com/b/CODE"
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-white text-black font-bold py-3 rounded uppercase tracking-wide hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {isLoading ? 'Envoi...' : editingId ? 'Modifier' : 'Créer'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 bg-zinc-700 text-white font-bold py-3 rounded uppercase tracking-wide hover:bg-zinc-600 transition"
              >
                Annuler
              </button>
            )}
          </div>
        </form>

        {/* Projects List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold uppercase">Projets Existants</h2>
          {projects.length === 0 ? (
            <p className="text-zinc-500">Aucun projet</p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-start gap-4"
              >
                <img
                  src={project.image_url}
                  alt={project.title}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{project.title}</h3>
                      <p className="text-sm text-zinc-400">/{project.slug}</p>
                      <p className="text-sm text-zinc-500 mt-1">{project.description}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        project.active === 1
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-zinc-700 text-zinc-400'
                      }`}
                    >
                      {project.active === 1 ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(project)}
                      className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded"
                    >
                      Modifier
                    </button>
                    <a
                      href={`/admin/content?project=${project.id}`}
                      className="text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 px-3 py-1 rounded inline-block"
                    >
                      Gérer Contenu
                    </a>
                    <button
                      onClick={() => toggleActive(project.id, project.active)}
                      className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded"
                    >
                      {project.active === 1 ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1 rounded"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
