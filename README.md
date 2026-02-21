# Project Links

Système de gestion centralisé pour promouvoir plusieurs projets via des landing pages dynamiques.

## Features

- **Routing dynamique**: `/[slug]` pour chaque projet
- **Landing page par projet**: CTA avec boutons vers WP + Payhip
- **Database Turso**: Gestion SQL simple
- **Zero maintenance**: Ajoutez un projet via INSERT SQL, aucun code requis
- **Design minimaliste**: Noir & blanc, responsive

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Turso (libSQL)
- Vercel (deploy)

## Installation

```bash
npm install
```

## Configuration

Créez `.env.local`:

```bash
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-token
```

## Initialisation Database

```bash
npm run dev
curl -X POST http://localhost:3000/api/setup
```

Cela crée la table `projects`.

## Ajouter un projet

Via Turso CLI ou dashboard:

```sql
INSERT INTO projects (slug, title, description, image_url, wp_url, payhip_url) 
VALUES (
  'projet-test',
  'Mon Premier Projet',
  'Description courte du projet',
  'https://bunny-cdn.com/image.jpg',
  'https://tonsite.com/projet-test',
  'https://payhip.com/b/ABC123'
);
```

Ça crée automatiquement: `https://projets.onlymatt.ca/projet-test`

## URLs

- Homepage: `/` - Liste tous les projets
- Projet: `/[slug]` - Landing page avec CTA
- API: `/api/projects` - JSON

## Déploiement Vercel

1. Push vers GitHub
2. Connecte le repo sur Vercel
3. Ajoute les variables d'environnement
4. Configure: `projets.onlymatt.ca`

## License

MIT
