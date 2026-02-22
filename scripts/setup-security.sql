-- Tables pour système de protection de contenu
-- À exécuter: turso db shell project-links < scripts/setup-security.sql

-- Table des codes d'accès (TOTP) par projet
CREATE TABLE IF NOT EXISTS access_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  totp_secret TEXT NOT NULL,
  payhip_license TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_used TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, email)
);

-- Table des sessions utilisateur (IP-bound)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  project_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  last_activity TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Table du contenu par projet (vidéos, photos, liens, texte)
CREATE TABLE IF NOT EXISTS project_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('video', 'photo', 'link', 'text')),
  title TEXT NOT NULL,
  description TEXT,
  bunny_video_id TEXT,           -- Pour type='video'
  bunny_image_url TEXT,           -- Pour type='photo'
  link_url TEXT,                  -- Pour type='link'
  link_label TEXT,                -- Label du bouton de lien
  text_content TEXT,              -- Pour type='text' (markdown supporté)
  order_index INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_access_codes_project ON access_codes(project_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_email ON access_codes(email);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_content_project ON project_content(project_id);
CREATE INDEX IF NOT EXISTS idx_content_active ON project_content(active);

-- Ajouter colonne payhip_product_id à la table projects si elle n'existe pas
-- (Pour pouvoir valider les codes Payhip par projet)
ALTER TABLE projects ADD COLUMN payhip_product_id TEXT;
