# Guide de Déploiement - Système de Protection

## 📋 Configuration Vercel (OBLIGATOIRE)

Va sur Vercel → project-links → Settings → Environment Variables et ajoute:

### Variables Turso (déjà configurées)
- ✅ `TURSO_DATABASE_URL`
- ✅ `TURSO_AUTH_TOKEN`
- ✅ `ADMIN_PASSWORD`

### Nouvelles variables à ajouter:

**Payhip:**
```
PAYHIP_API_KEY=ta_clé_api_payhip
PAYHIP_API_BASE_URL=https://payhip.com/api/v2
```

**Bunny Stream (vidéos):**
```
BUNNY_STREAM_LIBRARY_ID=ton_library_id
BUNNY_STREAM_API_KEY=ta_stream_api_key
```

**Bunny CDN (images):**
```
BUNNY_CDN_HOSTNAME=onlymatt-media.b-cdn.net
BUNNY_STORAGE_API_KEY=ta_storage_key (facultatif)
BUNNY_STORAGE_ZONE=onlymatt-public
BUNNY_CDN_TOKEN_KEY= (laisser vide si CDN public)
```

**Session:**
```
SESSION_DURATION_HOURS=24
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
  - **Page WordPress:** `https://onlymatt.ca/only-surrr` (optionnel maintenant)
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
Sur Payhip, édite ton produit "ONLY SURRR":
- **Download URL:** `https://projects.onlymatt.ca/api/access/qr?slug=only-surrr&code={license_key}`
- Prix: ton choix

### 4. Workflow utilisateur final

**Achat:**
1. User va sur https://projects.onlymatt.ca/only-surrr
2. Clique "Acheter Maintenant" → redirigé vers Payhip
3. Paie sur Payhip
4. Payhip valide le paiement
5. Redirigé vers `/api/access/qr?slug=only-surrr&code=LICENSE_KEY`
6. Système valide la license Payhip
7. Génère un QR code TOTP unique pour cet email
8. User scanne le QR dans Google Authenticator

**Accès au contenu:**
1. User va sur https://projects.onlymatt.ca/only-surrr/content
2. Entre son email + code TOTP (6 chiffres de l'app)
3. Session créée (IP-bound, durée 24h)
4. Accès au contenu protégé:
   - Vidéos streamées avec URLs signées
   - Photos, liens, textes affichés
5. Tant que la session est valide, pas besoin de re-entrer le code

## 🔒 Sécurité

**Protection côté serveur:**
- ✅ TOTP validé serveur (pas JavaScript)
- ✅ Session IP-bound (impossible de partager)
- ✅ URLs vidéo signées et temporaires
- ✅ Validation Payhip par product ID
- ✅ Contenu JAMAIS dans le HTML client

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
turso db shell project-links "INSERT INTO access_codes (project_id, email, totp_secret, ip_address) VALUES (1, 'test@example.com', 'SECRET_BASE32', '127.0.0.1');"
```

6. Va sur http://localhost:3000/test-projet/content
7. Entre email + code TOTP
8. Vérifie accès au contenu

## 📊 Monitoring

**Voir les sessions actives:**
```bash
turso db shell project-links "SELECT email, ip_address, created_at FROM sessions WHERE datetime(expires_at) > datetime('now');"
```

**Voir les codes d'accès:**
```bash
turso db shell project-links "SELECT email, created_at, last_used FROM access_codes WHERE project_id = 1;"
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
- Session expirée (>24h)
- Solution: Re-enter TOTP code

**"No access code found":**
- Email jamais activé
- Solution: Re-scan QR code Payhip

**Vidéo ne charge pas:**
- `BUNNY_STREAM_*` variables manquantes
- Video ID incorrect
- Solution: Vérifier console navigateur

**Build Vercel fail:**
- Variables manquantes → ajoute valeurs placeholder
- Erreur TypeScript → check logs
