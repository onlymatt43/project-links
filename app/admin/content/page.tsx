'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// Force dynamic rendering pour useSearchParams
export const dynamic = 'force-dynamic';

type BlockType = 'video' | 'photo' | 'link' | 'text';

interface ContentBlock {
  id?: number;
  type: BlockType;
  title: string;
  description: string;
  bunny_video_id: string;
  bunny_image_url: string;
  link_url: string;
  link_label: string;
  text_content: string;
  order_index: number;
}

export default function ContentManagementPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [formData, setFormData] = useState<Partial<ContentBlock>>({
    type: 'video',
    title: '',
    description: '',
    bunny_video_id: '',
    bunny_image_url: '',
    link_url: '',
    link_label: '',
    text_content: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadBlocks = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/admin/content?project_id=${projectId}`, {
        headers: { 'x-admin-password': password },
      });
      if (res.ok) {
        const data = await res.json();
        setBlocks(data.blocks);
      }
    } catch (err) {
      console.error('Failed to load blocks:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingId
        ? `/api/admin/content?id=${editingId}`
        : '/api/admin/content';
        
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ ...formData, project_id: projectId }),
      });

      if (res.ok) {
        setSuccess(editingId ? 'Bloc modifié!' : 'Bloc créé!');
        resetForm();
        loadBlocks();
      } else {
        setError('Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce bloc?')) return;
    try {
      const res = await fetch(`/api/admin/content?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });
      if (res.ok) {
        setSuccess('Bloc supprimé!');
        loadBlocks();
      }
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  const handleEdit = (block: ContentBlock) => {
    setFormData(block);
    setEditingId(block.id!);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ type: 'video', title: '', description: '', bunny_video_id: '', bunny_image_url: '', link_url: '', link_label: '', text_content: '' });
    setEditingId(null);
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuth(true);
        loadBlocks();
      } else {
        setError('Mot de passe incorrect');
      }
    } catch (err) {
      setError('Erreur');
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-8">
          <h1 className="text-3xl font-black uppercase mb-6">Admin - Contenu</h1>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full bg-black border border-zinc-700 rounded px-4 py-3 mb-4 focus:outline-none focus:border-white"
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button onClick={handleLogin} className="w-full bg-white text-black font-bold py-3 rounded uppercase">
            Connexion
          </button>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500">Projet manquant dans l'URL</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black uppercase">Gérer le Contenu</h1>
          <a href="/admin" className="text-zinc-400 hover:text-white text-sm">← Retour projets</a>
        </div>

        {(error || success) && (
          <div className={`px-4 py-3 rounded mb-6 ${error ? 'bg-red-900/20 border border-red-500 text-red-200' : 'bg-green-900/20 border border-green-500 text-green-200'}`}>
            {error || success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 uppercase">{editingId ? 'Modifier Bloc' : 'Nouveau Bloc'}</h2>

          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-1">Type de contenu</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as BlockType })}
              className="w-full bg-black border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-white"
            >
              <option value="video">📹 Vidéo (Bunny Stream)</option>
              <option value="photo">🖼️ Photo</option>
              <option value="link">🔗 Lien (collaborateur)</option>
              <option value="text">📝 Texte</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Titre"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full bg-black border border-zinc-700 rounded px-3 py-2 mb-3 focus:outline-none focus:border-white"
          />

          <textarea
            placeholder="Description (optionnelle)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="w-full bg-black border border-zinc-700 rounded px-3 py-2 mb-3 focus:outline-none focus:border-white"
          />

          {formData.type === 'video' && (
            <input
              type="text"
              placeholder="Bunny Video ID (ex: 12345abc-...)"
              value={formData.bunny_video_id}
              onChange={(e) => setFormData({ ...formData, bunny_video_id: e.target.value })}
              required
              className="w-full bg-black border border-zinc-700 rounded px-3 py-2 mb-3 focus:outline-none focus:border-white"
            />
          )}

          {formData.type === 'photo' && (
            <input
              type="url"
              placeholder="URL image Bunny CDN"
              value={formData.bunny_image_url}
              onChange={(e) => setFormData({ ...formData, bunny_image_url: e.target.value })}
              required
              className="w-full bg-black border border-zinc-700 rounded px-3 py-2 mb-3 focus:outline-none focus:border-white"
            />
          )}

          {formData.type === 'link' && (
            <>
              <input
                type="url"
                placeholder="URL du lien"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                required
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 mb-3 focus:outline-none focus:border-white"
              />
              <input
                type="text"
                placeholder="Texte du bouton (ex: Voir le site)"
                value={formData.link_label}
                onChange={(e) => setFormData({ ...formData, link_label: e.target.value })}
                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 mb-3 focus:outline-none focus:border-white"
              />
            </>
          )}

          {formData.type === 'text' && (
            <textarea
              placeholder="Contenu texte (markdown supporté)"
              value={formData.text_content}
              onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
              required
              rows={6}
              className="w-full bg-black border border-zinc-700 rounded px-3 py-2 mb-3 focus:outline-none focus:border-white font-mono text-sm"
            />
          )}

          <div className="flex gap-3 mt-4">
            <button type="submit" className="flex-1 bg-white text-black font-bold py-3 rounded uppercase">
              {editingId ? 'Modifier' : 'Créer'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-6 bg-zinc-700 font-bold py-3 rounded uppercase">
                Annuler
              </button>
            )}
          </div>
        </form>

        {/* Blocks List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold uppercase">Blocs de Contenu</h2>
          {blocks.length === 0 ? (
            <p className="text-zinc-500">Aucun bloc</p>
          ) : (
            blocks.map((block) => (
              <div key={block.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs bg-zinc-700 px-2 py-1 rounded mr-2 uppercase">{block.type}</span>
                    <span className="font-bold">{block.title}</span>
                    {block.description && <p className="text-sm text-zinc-500 mt-1">{block.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(block)} className="text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded">
                      Modifier
                    </button>
                    <button onClick={() => handleDelete(block.id!)} className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1 rounded">
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
