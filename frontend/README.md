# CEFOD IntelliRoom — Frontend

Interface web de gestion des réservations de salles du CEFOD : catalogue public, réservation en ligne, affichage temps réel (polling 5 s), chatbot d'orientation, messagerie, paiements et facturation — avec 4 espaces selon le rôle (client, réceptionniste, caissier, administrateur).

**Stack** : React 18 · Vite 6 · Tailwind CSS v4 · Axios · React Router 6 · Recharts.

## 1. Installation

```bash
cd frontend
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

## 2. Liaison avec le backend Laravel — les seules configurations à faire

1. **`.env`** : renseigner `VITE_API_URL` (par défaut `http://localhost:8000/api`).
2. **`src/api/endpoints.js`** : c'est le **point de configuration unique** de toutes les routes.
   Compare-le avec `backend/routes/api.php` et ajuste les chemins qui diffèrent — aucun autre fichier à modifier.
3. **CORS** (côté Laravel) : autoriser `http://localhost:5173` dans `config/cors.php`
   (`allowed_origins`), ou décommenter le `proxy` dans `vite.config.js` pour tout passer par Vite en dev.
4. L'authentification utilise **Sanctum en mode token** (`Authorization: Bearer …`) : le login doit
   renvoyer `{ token, utilisateur }` (le champ `user` est aussi accepté).

## 3. Conventions respectées (alignées sur le backend réel)

- Noms de colonnes réels : `id_salle`, `nom_salle`, `id_reservation`, `date_debut`, `contenu_mess`, etc.
- Enums exacts (`src/utils/constants.js`) : rôles, `categorie_client`
  (`org_internationale` / `admin_ong` / `association_base`), statuts de réservation
  (`en_attente → validee → confirmee → annulee` + `en_cours`/`terminee` calculés),
  modes de paiement (`especes` / `moov_money` / `airtel_money`).
- **Sécurité** : l'inscription n'envoie jamais de champ `role` (forcé à `client` côté serveur) ;
  la création des comptes du personnel passe par l'espace admin uniquement.
- **Tarification** : la `categorie_client` est déclarée à l'inscription, affichée en lecture seule
  sur le profil, corrigeable uniquement par l'admin ; le client voit le prix final avant tout paiement.
- Palette imposée noir / blanc / orange — aucune classe `text-gray-*`.
- Dates envoyées à l'API au format MySQL `YYYY-MM-DD HH:MM:SS`.

## 4. Structure

```
src/
├── api/           # client Axios + endpoints.js (config unique) + 1 module par ressource
├── components/    # common (Navbar, Modal, badges…), forms, chat
├── contexts/      # AuthContext (session Sanctum), NotificationContext (toasts)
├── hooks/         # useAuth, usePolling (temps réel 5 s), useRooms
├── layouts/       # MainLayout (public), DashboardLayout (espaces par rôle)
├── pages/         # public / client / receptionist / cashier / admin
└── utils/         # constantes métier, formats date/monnaie, storage, erreurs API
```

## 5. Pages principales

| Route | Accès | Description |
|---|---|---|
| `/` , `/salles`, `/salles/:id` | public | catalogue consultable sans compte |
| `/affichage` | public | écran temps réel plein écran (à projeter à l'accueil) |
| `/chatbot` | public | chatbot FAQ d'orientation |
| `/client/*` | client | réserver, suivre, payer en ligne, factures PDF, messagerie |
| `/reception/*` | réceptionniste | valider/refuser les demandes, messagerie, factures |
| `/caisse/*` | caissier | encaisser (espèces/Mobile Money), valider les paiements |
| `/admin/*` | admin | salles + grille tarifaire, utilisateurs, rapports, paramètres |

## 6. Production

```bash
npm run build      # génère dist/
```
Servir `dist/` (Nginx/Apache) en redirigeant toutes les routes vers `index.html` (SPA).
