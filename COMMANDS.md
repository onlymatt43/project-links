# Guide de Gestion des Projets

## Commandes Turso pour project-links

### Supprimer un projet
```bash
turso db shell project-links "DELETE FROM projects WHERE slug = 'nom-du-slug';"
```

### Ajouter un projet
```bash
turso db shell project-links "INSERT INTO projects (slug, title, description, image_url, wp_url, payhip_url) VALUES ('slug-unique', 'Titre du Projet', 'Description courte ici', 'https://onlymatt-media.b-cdn.net/image.jpg', 'https://onlymatt.ca/page-wp', 'https://payhip.com/b/CODE');"
```

### Voir tous les projets
```bash
turso db shell project-links "SELECT slug, title, active FROM projects;"
```

### Désactiver un projet (sans le supprimer)
```bash
turso db shell project-links "UPDATE projects SET active = 0 WHERE slug = 'nom-du-slug';"
```

### Réactiver un projet
```bash
turso db shell project-links "UPDATE projects SET active = 1 WHERE slug = 'nom-du-slug';"
```

### Modifier un projet existant
```bash
# Modifier le titre
turso db shell project-links "UPDATE projects SET title = 'Nouveau Titre' WHERE slug = 'nom-du-slug';"

# Modifier la description
turso db shell project-links "UPDATE projects SET description = 'Nouvelle description' WHERE slug = 'nom-du-slug';"

# Modifier l'image
turso db shell project-links "UPDATE projects SET image_url = 'https://onlymatt-media.b-cdn.net/nouvelle-image.jpg' WHERE slug = 'nom-du-slug';"

# Modifier le lien WordPress
turso db shell project-links "UPDATE projects SET wp_url = 'https://onlymatt.ca/nouvelle-page' WHERE slug = 'nom-du-slug';"

# Modifier le lien Payhip
turso db shell project-links "UPDATE projects SET payhip_url = 'https://payhip.com/b/NOUVEAU' WHERE slug = 'nom-du-slug';"
```

## Notes Importantes

- **Slug unique** : Le `slug` doit être unique et devient l'URL finale  
  → https://projects.onlymatt.ca/ton-slug

- **Format du slug** : Utilise des tirets `-` pour les espaces  
  → Exemple : "only-surrr" pour "ONLY SURRR"

- **Apostrophes** : Échappe les apostrophes avec `''` (deux fois)  
  → Exemple : `"C''est génial"` pour "C'est génial"

- **Changements instantanés** : Les modifications sont visibles immédiatement sur le site (pas besoin de redéployer)

- **Active = 1** : Seuls les projets avec `active = 1` sont affichés sur le site

## Workflow Complet

1. **Créer page WordPress** avec contenu protégé (via auth-payment-system)
2. **Créer produit Payhip** pour vendre l'accès
3. **Uploader image** sur Bunny CDN (onlymatt-media.b-cdn.net)
4. **Exécuter INSERT** dans Turso avec toutes les infos
5. **Partager le lien** : https://projects.onlymatt.ca/ton-slug
6. **Profit!** 🚀

## Structure de la Table

```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  wp_url TEXT NOT NULL,
  payhip_url TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Exemples Concrets

### Exemple 1: ONLY SURRR
```bash
turso db shell project-links "INSERT INTO projects (slug, title, description, image_url, wp_url, payhip_url) VALUES ('only-surrr', 'ONLY SURRR', 'Projet de création exclusive avec contenu premium', 'https://onlymatt-media.b-cdn.net/projects/only-surrr-cover.jpg', 'https://onlymatt.ca/only-surrr', 'https://payhip.com/b/ABC123');"
```

### Exemple 2: Supprimer le projet test
```bash
turso db shell project-links "DELETE FROM projects WHERE slug = 'test-projet';"
```

### Exemple 3: Voir tous les projets actifs
```bash
turso db shell project-links "SELECT id, slug, title FROM projects WHERE active = 1 ORDER BY created_at DESC;"
```
