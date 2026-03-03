# Guide de Déploiement - Système Simple Payhip

## 📋 Configuration Vercel (OBLIGATOIRE)

Va sur Vercel → project-links → Settings → Environment Variables et ajoute:

### Variables Turso (déjà configurées)
- ✅ `TURSO_DATABASE_URL`
- ✅ `TURSO_AUTH_TOKEN`
- ✅ `ADMIN_PASSWORD`

### Nouvelles variables à ajouter:

**Payhip:**
```
PAYHIP_API_KEY=prod_sk_YrwzM_2228ed2bfd434a9fba256a0dc14bfad7dc3001af
PAYHIP_API_BASE_URL=https://payhip.com/api/v2
```

**Bunny Stream (mêmes valeurs que super-videotheque):**
```
BUNNY_LIBRARY_ID=552081
BUNNY_API_KEY=202d4df5-5617-4738-9c82a7cae508-e3c5-48ef
BUNNY_PULL_ZONE_HOST=vz-c69f4e3f-963.b-cdn.net
BUNNY_SIGNING_KEY=f3134903-1ab7-4637-8fe4-2870afe490ba
```

**Session:**
```
SESSION_DURATION_HOURS=1
```

## 🚀 Flow Complet ONLY SURRR

### 1. Créer le projet dans l'admin
- Va sur https://projects.onlymatt.ca/admin
- Mot de passe: `Mack1984$`
- Créer projet:
  - **Slug:** `only-surrr`
  - **Title:** `ONLY SURRR`
  - **Description:** "Projet créatif exclusif avec vidéos et contenu premium"
  - **Image:** URL Bunny CDN de l'image preview
  - **Payhip URL:** `https://payhip.com/b/TON_CODE_PRODUIT`
  - **Payhip Product ID:** `ABC123` (ID du produit Payhip)

### 2. Ajouter du contenu au projet
- Dans l'admin, clique "Gérer Contenu" sur le projet
- Ajoute des blocs:

**Vidéo Bunny Stream:**
- Type: Vidéo
- Titre: "Introduction ONLY SURRR"
- Bunny Video ID: `12345abc-...` (depuis Bunny Stream dashboard)

**Photo:**
- Type: Photo
- Titre: "Galerie exclusive"
- URL: `https://onlymatt-media.b-cdn.net/only-surrr/photo1.jpg`

**Lien collaborateur:**
- Type: Lien
- Titre: "Collaborateur - John Doe"
- URL: `https://johndoe.com`
- Label bouton: "Voir le site →"

**Texte:**
- Type: Texte
- Titre: "À propos du projet"
- Contenu: Description markdown...

### 3. Configurer Payhip
Sur Payhip, crée/édite ton produit "ONLY SURRR":
- Nom du produit doit correspondre au slug: `only-surrr`
- Prix: ton choix
- Type: License Key (Payhip génère automatiquement)
- Pas besoin de Download URL → le client reçoit la license key par email Payhip

### 4. Workflow utilisateur final

**Achat:**
1. User va sur https://projects.onlymatt.ca/only-surrr
2. Clique "Acheter Maintenant" → redirigé vers Payhip
3. Paie sur Payhip
4. Payhip valide le paiement
5. User reçoit email Payhip avec:
   - Confirmation d'achat
   - **License Key** (code unique généré par Payhip)
   - Email utilisé pour l'achat

**Accès au contenu:**
1. User va sur https://projects.onlymatt.ca/only-surrr/content
2. Entre son **email** + **code de licence Payhip**
3. Système valide via API Payhip:
   - License key existe?
   - Email correspond?
   - Produit correspond?
4. Session créée (IP-bound, durée 1h)
5. Accès au contenu protégé:
   - Vidéos streamées avec URLs signées Bunny
   - Photos, liens, textes affichés
6. Tant que la session est valide, pas besoin de re-entrer le code
7. Après 1h ou changement d'IP → redemander email + license key

## 🔒 Sécurité

**Protection côté serveur:**
- ✅ License Payhip validée via API serveur (pas JavaScript)
- ✅ Session IP-bound (impossible de partager)
- ✅ URLs vidéo signées et temporaires (Bunny Stream)
- ✅ Validation Payhip par product ID
- ✅ Contenu JAMAIS dans le HTML client
- ✅ Session courte (1h) pour limiter exposition

**Ce qui est protégé:**
- Vidéos Bunny Stream (signed URLs)
- Tout le contenu affiché sur /content
- Accès lié à l'IP pour éviter le partage de session

**Ce qui reste public:**
- Landing page `/only-surrr`
- Preview image
- Description du projet

## 🧪 Test Local

1. Ajoute les vraies clés dans `.env.local`
2. `npm run dev`  
3. Va sur http://localhost:3000/admin
4. Créer projet test + contenu
5. Simuler achat (crée manuellement un access_code dans Turso):

```bash
turso db shell project-links "INSERT INTO access_codes (project_id, email, license_key, created_at) VALUES (1, 'test@example.com', 'PAYHIP-TEST-KEY-123', datetime('now'));"
```

6. Va sur http://localhost:3000/test-projet/content
7. Entre email + license key `PAYHIP-TEST-KEY-123`
8. Vérifie accès au contenu

**Note:** Pour un test complet avec validation Payhip, utilise une vraie license key d'un achat test sur Payhip.

## 📊 Monitoring

**Voir les sessions actives:**
```bash
turso db shell project-links "SELECT email, ip_address, created_at FROM sessions WHERE datetime(expires_at) > datetime('now');"
```

**Voir les codes d'accès:**
```bash
turso db shell project-links "SELECT email, license_key, created_at FROM access_codes WHERE project_id = 1;"
```

**Clean expired sessions (optionnel, automatique):**
```bash
turso db shell project-links "DELETE FROM sessions WHERE datetime(expires_at) < datetime('now');"
```

## 🎯 Prochaines Étapes

1. ✅ Code pushé sur GitHub
2. ⏸ Attendre build Vercel
3. ⏸ Ajouter variables environnement Vercel
4. ⏸ Redéployer
5. ⏸ Créer ONLY SURRR dans l'admin
6. ⏸ Tester flow complet en production
7. ⏸ Lancer les ventes! 🚀

## 🆘 Troubleshooting

**"Invalid session":**
- IP changé (VPN, mobile data switch)
- Session expirée (>1h)
- Solution: Re-enter email + license key

**"No access code found" / "Invalid license key":**
- License key invalide ou jamais activée
- Email ne correspond pas à l'achat Payhip
- Produit Payhip ne correspond pas au projet
- Solution: Vérifier email exact de l'achat Payhip + copier license key correctement

**Vidéo ne charge pas:**
- `BUNNY_STREAM_*` variables manquantes
- Video ID incorrect
- URL signée expirée (>1h)
- Solution: Vérifier console navigateur, recharger la page

**Build Vercel fail:**
- Variables manquantes → ajoute valeurs placeholder
- Erreur TypeScript → check logs
