-- Migration: Système de PASSES multi-durées (remplace membership)
-- Date: 2026-02-22
-- Description: Permet de vendre plusieurs "passes" pour un même projet avec durées différentes
-- Exécution: turso db shell project-links < scripts/add-multi-duration-passes.sql

-- ========================================
-- 1. CRÉER TABLE project_products (PASSES)
-- ========================================

-- Un projet peut avoir plusieurs produits Payhip avec durées différentes
CREATE TABLE IF NOT EXISTS project_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  payhip_product_id TEXT NOT NULL,     -- Product ID Payhip (ex: "ABC123")
  product_name TEXT NOT NULL,           -- Nom du pass (ex: "Pass 1 mois")
  duration_hours INTEGER NOT NULL,      -- Durée de la session en heures (ex: 720 = 1 mois)
  active INTEGER DEFAULT 1,             -- Actif ou désactivé
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(payhip_product_id)             -- Un product_id Payhip = 1 seul pass
);

-- ========================================
-- 2. MIGRER payhip_product_id EXISTANTS
-- ========================================

-- Si des projets ont déjà un payhip_product_id, créer un pass "Standard" par défaut
INSERT INTO project_products (project_id, payhip_product_id, product_name, duration_hours, active)
SELECT 
  id,
  payhip_product_id,
  'Pass Standard',
  1,  -- 1 heure par défaut
  1
FROM projects
WHERE payhip_product_id IS NOT NULL 
AND payhip_product_id != ''
AND access_type = 'one-time';

-- ========================================
-- 3. NETTOYER COLONNES OBSOLÈTES
-- ========================================

-- Supprimer colonnes membership de projects (on garde que access_type pour référence)
-- SQLite ne supporte pas DROP COLUMN, donc on recrée la table

CREATE TABLE projects_clean (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  wp_url TEXT NOT NULL,
  payhip_url TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Copier données
INSERT INTO projects_clean (id, slug, title, description, image_url, wp_url, payhip_url, active, created_at)
SELECT id, slug, title, description, image_url, wp_url, payhip_url, active, created_at
FROM projects;

-- Drop et rename
DROP TABLE projects;
ALTER TABLE projects_clean RENAME TO projects;

-- Recréer index
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- ========================================
-- 4. NETTOYER access_codes (supprimer membership)
-- ========================================

-- Supprimer colonnes membership (access_type, is_active, membership_expires_at)
CREATE TABLE access_codes_clean (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  license_key TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, email)
);

-- Copier seulement les one-time actifs
INSERT INTO access_codes_clean (id, project_id, email, license_key, created_at)
SELECT id, project_id, email, license_key, created_at
FROM access_codes
WHERE license_key IS NOT NULL;

-- Drop et rename
DROP TABLE access_codes;
ALTER TABLE access_codes_clean RENAME TO access_codes;

-- Recréer index
CREATE INDEX IF NOT EXISTS idx_access_codes_project ON access_codes(project_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_email ON access_codes(email);

-- ========================================
-- 5. CRÉER INDEX project_products
-- ========================================

CREATE INDEX IF NOT EXISTS idx_project_products_project ON project_products(project_id);
CREATE INDEX IF NOT EXISTS idx_project_products_payhip ON project_products(payhip_product_id);
CREATE INDEX IF NOT EXISTS idx_project_products_active ON project_products(active);

-- ========================================
-- RÉSULTAT FINAL
-- ========================================

-- projects: id, slug, title, description, image_url, wp_url, payhip_url, active, created_at
-- project_products: id, project_id, payhip_product_id, product_name, duration_hours, active, created_at
-- access_codes: id, project_id, email, license_key, created_at
-- sessions: id, project_id, email, ip_address, created_at, expires_at

-- ========================================
-- EXEMPLE D'UTILISATION
-- ========================================

-- Créer passes pour ONLY SURRR (projet id=1):
-- INSERT INTO project_products (project_id, payhip_product_id, product_name, duration_hours) VALUES
--   (1, 'ABC123', 'Pass 1 heure', 1),
--   (1, 'ABC124', 'Pass 1 jour', 24),
--   (1, 'ABC125', 'Pass 1 semaine', 168),
--   (1, 'ABC126', 'Pass 1 mois', 720);
