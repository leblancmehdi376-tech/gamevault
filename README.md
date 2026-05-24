# 🎮 GameVault

Suivi de complétion de jeux vidéo pour ton groupe de potes. Style bibliothèque Steam sombre.

## Stack
- **Next.js 15** (App Router, sans dossier `src`)
- **Supabase** (Auth + PostgreSQL + RLS)
- **IGDB** (base de données de jeux via Twitch API)
- **Tailwind CSS v3**

---

## 🚀 Installation

```bash
npm install
npm run dev
```

---

## ⚙️ Configuration Supabase (obligatoire)

### 1. Lancer le schéma SQL

Dans ton **Supabase Dashboard → SQL Editor**, colle et exécute le contenu de `supabase-schema.sql`. Cela crée :
- La table `profiles`
- La table `user_games`
- Les politiques RLS
- Le trigger qui crée automatiquement le profil à l'inscription

### 2. Configurer l'URL de redirection Auth

Dans **Supabase Dashboard → Authentication → URL Configuration** :
- **Site URL** : `http://localhost:3000` (changer en prod)
- **Redirect URLs** : ajouter `http://localhost:3000/auth/callback`

### 3. (Optionnel) Désactiver la confirmation d'email en dev

Dans **Authentication → Providers → Email** :
- Désactive **"Confirm email"** pour tester sans boîte mail

---

## 📁 Structure du projet

```
├── app/
│   ├── page.tsx                    ← Page d'accueil / Auth
│   ├── library/page.tsx            ← Bibliothèque perso (protégée)
│   ├── search/page.tsx             ← Recherche IGDB (protégée)
│   ├── profile/[username]/page.tsx ← Profil public
│   ├── auth/callback/route.ts      ← Callback Supabase OAuth
│   └── api/igdb/route.ts           ← Proxy IGDB (clés serveur)
├── components/
│   ├── AuthForm.tsx                ← Formulaire connexion/inscription
│   ├── NavBar.tsx                  ← Barre de navigation
│   └── AddGameModal.tsx            ← Modal ajout de jeu
├── lib/
│   ├── supabase.ts                 ← Client navigateur
│   └── supabase-server.ts          ← Client serveur (SSR)
├── middleware.ts                   ← Protection des routes
└── supabase-schema.sql             ← Schéma BDD à exécuter
```

---

## ✨ Fonctionnalités

- **Inscription / Connexion** avec email + mot de passe
- **Recherche de jeux** via IGDB (couvertures, dates de sortie)
- **Bibliothèque personnelle** avec :
  - Statuts : 100% 🏆, En cours, Terminé, Abandonné, À commencer
  - Plateformes : PC, PS5, PS4, Xbox, Switch, iOS, Android
  - Filtres par statut et plateforme
  - Modification rapide du statut au survol
  - Suppression de jeux
- **Profil public** visitables par les potes (`/profile/[username]`)
  - Statistiques de complétion
  - Taux de 100%

---

## 🔒 Sécurité

Toutes les routes `/library` et `/search` sont protégées par le middleware.
Les clés IGDB restent côté serveur (jamais exposées au navigateur).
Le RLS Supabase empêche tout accès non autorisé en base.
"# gamevault" 
