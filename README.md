# UltraTech Online

**UltraTech Online** est un jeu narratif cyberpunk jouable dans le navigateur. Vous incarnez un opérateur clandestin qui infiltre le réseau d'UltraTech Corp. via un terminal sécurisé : fichiers cryptés, missions, nœuds réseau, Black Market et mécanique de **TRACE** (surveillance corporatiste).

> **État actuel : Alpha publique — Demo Offline**  
> La version Netlify fonctionne **sans backend** : progression sauvegardée dans le navigateur (`localStorage`). Le mode multijoueur (comptes, chat global, sauvegardes serveur) nécessite le backend Python en local.

---

## Versionning & archives

Ne **jamais** committer ni inclure dans un zip de distribution :

- `node_modules/` · `frontend/node_modules/`
- `frontend/dist/`
- `backend/venv/` · `__pycache__/` · `*.pyc`

Ces chemins sont listés dans [`.gitignore`](.gitignore). Pour créer une archive propre :

```powershell
git archive -o UT-Project.zip HEAD
```

---

## Jouer en ligne (Netlify)

**Lien alpha :** [https://ut-project.netifly.app](https://ut-project.netifly.app)

### Écran d'accueil

| Bouton | Action |
|--------|--------|
| **OUVRIR LA BÊTA TEST** | Reprend ou démarre la session locale |
| **Réinitialiser la sauvegarde** | Nouvelle partie — Mission 1 |

Le jeu guide le débutant pas à pas dans le terminal (`help` → `files` → `open note.txt` → `scan` → …).

### En jeu

- **Reset** — Recommence depuis la Mission 1
- **? Aide** — Guide optionnel (le tutoriel principal se fait en jouant)

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React + Vite |
| Backend (local) | Python + FastAPI |
| Démo Netlify | Moteur offline (`frontend/src/demo/`) + localStorage |
| API (local) | REST |

---

## Limitations actuelles (Alpha)

- **Pas de backend hébergé** sur Netlify — pas de login/register en production
- **Pas de multijoueur** ni chat global synchronisé en ligne
- **Sauvegarde locale uniquement** — effacée si vous videz les données du navigateur
- Certaines commandes avancées du backend complet peuvent être simplifiées en mode démo
- Le feedback alpha se configure via `frontend/.env` (`VITE_FEEDBACK_EMAIL`, etc.)

---

## Lancer en local (développement complet)

### Prérequis

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API : http://localhost:8000 — Docs : http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Jeu : http://localhost:5173

Avec le backend actif, le client se connecte en mode **multijoueur** (login/register). Sans backend, le mode **démo offline** s'active automatiquement.

---

## Déployer sur Netlify

1. Connecter le dépôt GitHub à Netlify
2. Build settings (ou utiliser `netlify.toml` à la racine) :
   - **Base directory :** `frontend`
   - **Build command :** `npm run build`
   - **Publish directory :** `frontend/dist`
3. Variables d'environnement (optionnel) :
   - `VITE_NETLIFY_URL` — URL publique
   - `VITE_FEEDBACK_EMAIL` — email feedback
   - `VITE_FEEDBACK_DISCORD` / `VITE_FEEDBACK_TWITTER`

---

## Mission 1 — Signal Fantôme (guide)

1. `help` — commandes de base
2. `ls` puis `open readme.txt` et `open system.log`
3. `scan` — débloqué après lecture de system.log
4. `open ghost_relay.log` — débloque `connect`
5. `connect relay_ghost` — infiltration du relais
6. Surveiller la **TRACE** en haut de l'écran

---

## Structure du projet

```
UT-Project/
├── frontend/           # React + Vite
│   ├── src/
│   │   ├── api/        # Client REST + routage démo
│   │   ├── demo/       # Moteur offline (Netlify)
│   │   └── components/
│   └── .env.example
├── backend/            # FastAPI (local / futur hébergement)
│   ├── main.py
│   ├── data/
│   └── services/
├── netlify.toml
└── README.md
```

---

## Fichiers à ne pas committer

Vérifiés dans `.gitignore` :

- `backend/venv/`, `node_modules/`
- `frontend/dist/`
- `.env`, `.env.local`
- `backend/data/saves/` (sauvegardes joueurs)
- fichiers temporaires (`*.log`, `*.tmp`)

---

## Licence / Contact

Prototype alpha — UltraTech Online.  
Feedback : configurez `VITE_FEEDBACK_EMAIL` ou ouvrez une issue sur le dépôt.
