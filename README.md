# UltraTech Online

Jeu navigateur narratif cyberpunk — terminal interactif, hacking, enquête et progression.

## Stack

| Couche     | Technologie              |
|------------|--------------------------|
| Frontend   | React.js + Vite          |
| Backend    | Python + FastAPI         |
| Sauvegarde | JSON local (`backend/data/`) |
| API        | REST                     |

## Structure

```
UT-Project/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── api/       # Client REST
│   │   └── components/
│   └── package.json
├── backend/           # FastAPI
│   ├── main.py
│   ├── data/
│   │   ├── game_state.json
│   │   ├── files.json
│   │   ├── commands.json
│   │   └── story.json
│   ├── models/
│   ├── services/
│   └── requirements.txt
└── README.md
```

## Prérequis

- **Python 3.10+**
- **Node.js 18+** et npm

---

## Installation et lancement

### Étape 1 — Backend Python

```bash
cd backend

# Créer un environnement virtuel (recommandé)
python -m venv venv

# Activer l'environnement
# Windows (PowerShell) :
.\venv\Scripts\Activate.ps1
# Windows (CMD) :
venv\Scripts\activate.bat
# macOS / Linux :
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
uvicorn main:app --reload --port 8000
```

Le backend est accessible sur **http://localhost:8000**  
Documentation API interactive : **http://localhost:8000/docs**

### Étape 2 — Frontend React

Ouvrir un **second terminal** :

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le jeu est accessible sur **http://localhost:5173**

---

## Tester la Mission 1 — Signal Fantôme

1. Ouvrir **http://localhost:5173** dans le navigateur.
2. Taper `help` — seules les commandes de base sont listées.
3. Taper `ls` — voir les fichiers disponibles.
4. Taper `open readme.txt` — lire le brief d'accueil.
5. Taper `open system.log` — découvrir l'indice **scan**.
6. Taper `scan` — analyser le réseau, débloquer `ghost_relay.log`.
7. Taper `open ghost_relay.log` — découvrir la commande **connect relay_ghost**.
8. Taper `connect relay_ghost` — événement N0VA, +50 BitTek, +1 réputation.
9. Taper `status` — vérifier la mission terminée.
10. Taper `open nova_contact.dat` — lire le message de N0VA.

Pour recommencer : cliquer **↺ Reset Save** en haut à droite.

---

## Commandes disponibles

| Commande              | Disponibilité   | Description                    |
|-----------------------|-----------------|--------------------------------|
| `help`                | Départ          | Aide (sans révéler les cachées)|
| `clear`               | Départ          | Efface le terminal             |
| `ls`                  | Départ          | Liste les fichiers             |
| `open [fichier]`      | Départ          | Lit un fichier                 |
| `status`              | Départ          | Statut opérateur               |
| `scan`                | À découvrir     | Analyse réseau                 |
| `connect relay_ghost` | À découvrir     | Connexion au relais fantôme (+25 trace) |
| `decrypt`             | Futur           | Déchiffrement (+10 trace)               |

## Mécanique UltraTech Trace

UltraTech tente progressivement de localiser le joueur. Certaines actions augmentent le niveau de traque (0–100 %) :

| Action                    | Trace |
|---------------------------|-------|
| `scan`                    | +15   |
| `connect relay_ghost`       | +25   |
| Commande inconnue         | +2    |
| `decrypt` (futur)         | +10   |

Seuils narratifs : 30 %, 60 %, 85 %, 100 % (**Game Over** — séquence chaotique + écran final).

### Game Over (100 % trace)

- `gameOver: true` en backend — commandes bloquées
- Séquence automatique ~15 s : freeze, glitch, popups, caméra, auto-typing, N0VA, écran final
- Bouton **Recommencer** pour reset la sauvegarde

**Test rapide :** spammer des commandes invalides (`hack`, `test`…) — +2 % par tentative.

---

## API REST

| Méthode | Endpoint        | Description              |
|---------|-----------------|--------------------------|
| GET     | `/api/health`   | Santé du serveur         |
| GET     | `/api/state`    | État du joueur           |
| POST    | `/api/command`  | Exécuter une commande    |
| POST    | `/api/reset`    | Réinitialiser la sauvegarde |
| GET     | `/api/market`   | Catalogue Black Market      |
| POST    | `/api/market/buy` | Acheter un objet          |
| GET     | `/api/inventory`| Inventaire + effets actifs  |
| POST    | `/api/inventory/use` | Utiliser un objet      |

## Black Market

App **BLACK MARKET** sur le bureau — débloquée après Mission 1 ou lecture de `market://blacknode`.

| Objet | Prix | Effet |
|-------|------|-------|
| Firewall Jetable | 30 ₿ | -15 % trace (usage unique) |
| Proxy Fantôme | 50 ₿ | -25 % trace (usage unique) |
| Brouilleur N0VA | 75 ₿ | 2 prochaines augmentations de trace /2 |
| Spoof d'Identité | 100 ₿ | -40 % trace + alerte UltraTech |
| Pack Firewall Basique | 120 ₿ | Passif permanent : -5 % sur toutes les augmentations |

Les objets consommables vont dans l'inventaire. Le passif s'applique à l'achat. Achat impossible si Game Over ou BitTek insuffisant.
