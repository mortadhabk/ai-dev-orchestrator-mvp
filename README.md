# ai-dev-orchestrator-mvp

MVP open-source friendly pour orchestrer des agents IA depuis Trello vers GitHub, avec isolation par container et suivi de statut Trello.

## Architecture

- **orchestrator** (Express + TypeScript): reçoit webhook Trello, applique idempotence + lock SQLite, crée la branche GitHub, déplace la carte Trello, puis enqueue job BullMQ.
- **worker** (BullMQ consumer): exécute `docker run` pour lancer un container agent isolé par job, collecte logs, et reporte succès/erreur sur Trello.
- **agent** (container TypeScript): récupère la carte Trello, clone le repo GitHub, modifie `README.md` ou `AI_CHANGELOG.md`, commit/push, ouvre une PR.
- **redis**: broker queue BullMQ.
- **sqlite**: persistance locale dans l'orchestrator (`events_seen`, `card_locks`).

## Prérequis

- Docker
- Docker Compose plugin (`docker compose`)
- Un token GitHub fine-grained (`GITHUB_TOKEN`) avec accès repo + PR
- Trello API key + token (`TRELLO_KEY`, `TRELLO_TOKEN`)

> Ne stockez jamais les secrets en dur dans le code; utilisez uniquement `.env`.

## Configuration

1. Copier l'exemple d'environnement:

```bash
cp .env.example .env
```

2. Remplir au minimum dans `.env`:
   - `WEBHOOK_SECRET`
   - `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `REPO_HTTP_URL`
   - `TRELLO_KEY`, `TRELLO_TOKEN`
   - `TRELLO_LIST_INPROGRESS_ID`, `TRELLO_LIST_REVIEW_ID`
   - Optionnel: `TRELLO_LIST_BLOCKED_ID`

3. Créer un webhook Trello vers:

```text
https://<votre-vps>/webhooks/trello
```

4. Configurer les IDs de listes Trello dans `.env`:
   - **In Progress (AI)** => `TRELLO_LIST_INPROGRESS_ID`
   - **Review** => `TRELLO_LIST_REVIEW_ID`
   - **Blocked** (optionnel) => `TRELLO_LIST_BLOCKED_ID`

## Lancement local

```bash
docker compose up --build
```

Orchestrator est exposé sur `http://localhost:8080`.

## Test avec mock

```bash
./tools/send-mock.sh http://localhost:8080
```

Le payload mock est dans `tools/mock-trello-event.json`.

## Déploiement VPS

1. Copier le repo sur le VPS
2. Créer `.env` à partir de `.env.example`
3. Lancer:

```bash
docker compose up -d --build
```

4. Vérifier logs:

```bash
docker compose logs -f orchestrator worker
```

## Flux webhook MVP

1. Trello envoie `commentCard`.
2. Orchestrator valide header `x-webhook-secret`.
3. Détecte mention `@ai-backend`, `@ai-frontend` ou `@ai-devops`.
4. Idempotence via `events_seen` (ignore action déjà traitée).
5. Lock carte via `card_locks` (TTL) pour éviter traitement parallèle.
6. Crée branche GitHub `feature/<shortCardId>-<agent>-<timestamp>`.
7. Commente Trello + move carte vers in-progress.
8. Enqueue job BullMQ.
9. Worker lance un container agent isolé (`1 job = 1 container = 1 workspace`).
10. Agent commit/push + ouvre PR puis renvoie URL PR en JSON stdout.
11. Worker commente Trello avec URL PR + move carte vers review (ou blocked si échec).

## Notes sécurité

- Aucun mot de passe GitHub/Trello demandé.
- Tous les secrets passent via env vars.
- PAT GitHub utilisé pour MVP; architecture prête pour migration GitHub App.
- Socket Docker monté **uniquement** côté worker.
