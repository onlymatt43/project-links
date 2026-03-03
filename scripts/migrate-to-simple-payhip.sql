-- Migration: TOTP System → Simple Payhip License System
-- Date: 2025
-- Description: Retire totp_secret et colonnes obsolètes, ajoute license_key
-- Exécution: turso db shell project-links < scripts/migrate-to-simple-payhip.sql

-- Étape 1: Créer nouvelle table access_codes avec schéma simplifié
CREATE TABLE IF NOT EXISTS access_codes_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  license_key TEXT,           -- Code Payhip (peut être NULL si pas encore validé)
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, email)
);

-- Étape 2: Copier données existantes (si la vieille table existe)
-- Note: license_key reste NULL si pas de payhip_license dans ancienne table
INSERT INTO access_codes_new (id, project_id, email, license_key, created_at)
SELECT 
  id,
  project_id, 
  email, 
  payhip_license,  -- Ancienne colonne payhip_license devient license_key
  created_at
FROM access_codes
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='access_codes');

-- Étape 3: Supprimer ancienne table
DROP TABLE IF EXISTS access_codes;

-- Étape 4: Renommer nouvelle table
ALTER TABLE access_codes_new RENAME TO access_codes;

-- Étape 5: Recréer index
CREATE INDEX IF NOT EXISTS idx_access_codes_project ON access_codes(project_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_email ON access_codes(email);

-- Étape 6: Nettoyer table sessions (retirer colonnes obsolètes user_agent, last_activity)
-- Note: On garde les sessions actives mais sans ces colonnes
CREATE TABLE IF NOT EXISTS sessions_new (
  id TEXT PRIMARY KEY,
  project_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Copier sessions valides uniquement (non expirées)
INSERT INTO sessions_new (id, project_id, email, ip_address, created_at, expires_at)
SELECT 
  id,
  project_id,
  email,
  ip_address,
  created_at,
  expires_at
FROM sessions
WHERE datetime(expires_at) > datetime('now')
AND EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='sessions');

-- Supprimer ancienne table sessions
DROP TABLE IF EXISTS sessions;

-- Renommer nouvelle table
ALTER TABLE sessions_new RENAME TO sessions;

-- Recréer index sessions
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Étape 7: Nettoyage final (supprimer sessions expirées restantes)
DELETE FROM sessions WHERE datetime(expires_at) < datetime('now');

-- Résultat attendu:
-- ✅ access_codes: id, project_id, email, license_key, created_at
-- ✅ sessions: id, project_id, email, ip_address, created_at, expires_at
-- ✅ Ancien système TOTP complètement retiré
