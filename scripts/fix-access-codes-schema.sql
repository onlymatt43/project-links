-- Fix: Migration access_codes vers schéma final
-- Date: 2026-02-22
-- Problème: Table a les nouvelles colonnes membership MAIS aussi les anciennes colonnes TOTP
-- Solution: Nettoyer et ne garder que les colonnes nécessaires

-- Étape 1: Créer table propre avec le schéma final
CREATE TABLE access_codes_clean (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  license_key TEXT,                    -- Code Payhip (one-time ou NULL pour membership)
  access_type TEXT DEFAULT 'one-time', -- 'one-time' | 'membership'
  is_active INTEGER DEFAULT 0,         -- Pour memberships (1=actif, 0=inactif)
  membership_expires_at TEXT,          -- Backup expiration membership
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, email)
);

-- Étape 2: Copier données existantes (payhip_license → license_key)
INSERT INTO access_codes_clean (
  id, 
  project_id, 
  email, 
  license_key,           -- Nouvelle colonne
  access_type, 
  is_active, 
  membership_expires_at, 
  created_at
)
SELECT 
  id,
  project_id,
  email,
  payhip_license,        -- Ancienne colonne devient license_key
  access_type,
  is_active,
  membership_expires_at,
  created_at
FROM access_codes;

-- Étape 3: Drop ancienne table
DROP TABLE access_codes;

-- Étape 4: Renommer table propre
ALTER TABLE access_codes_clean RENAME TO access_codes;

-- Étape 5: Recréer index
CREATE INDEX IF NOT EXISTS idx_access_codes_project ON access_codes(project_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_email ON access_codes(email);
CREATE INDEX IF NOT EXISTS idx_access_codes_type ON access_codes(access_type);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(is_active);

-- Étape 6: Nettoyer table sessions (même approche)
CREATE TABLE sessions_clean (
  id TEXT PRIMARY KEY,
  project_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Copier sessions valides seulement
INSERT INTO sessions_clean (id, project_id, email, ip_address, created_at, expires_at)
SELECT 
  id,
  project_id,
  email,
  ip_address,
  created_at,
  expires_at
FROM sessions
WHERE datetime(expires_at) > datetime('now');

-- Drop ancienne table sessions
DROP TABLE sessions;

-- Renommer
ALTER TABLE sessions_clean RENAME TO sessions;

-- Recréer index sessions
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ========================================
-- RÉSULTAT FINAL
-- ========================================
-- access_codes: id, project_id, email, license_key, access_type, is_active, membership_expires_at, created_at
-- sessions: id, project_id, email, ip_address, created_at, expires_at
-- ✅ Colonnes obsolètes supprimées: totp_secret, payhip_license, ip_address (access_codes), last_used, user_agent, last_activity
