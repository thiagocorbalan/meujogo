# MatchSoccer

A web application for managing weekly soccer matches among friends. It handles player registration, attendance confirmation, team draws, live match tracking, scoring, ELO ratings, and season management.

## Tech Stack

### Backend (`api/`)

- **NestJS 11** — TypeScript REST API
- **Prisma** — ORM with PostgreSQL adapter (`@prisma/adapter-pg`)
- **PostgreSQL 16** — Database
- **Jest 30** + **Supertest** — Unit and E2E testing
- **ESLint** + **Prettier** — Code formatting

### Frontend (`app/`)

- **Nuxt 3** — Vue 3 framework with SSR and file-based routing
- **Pinia** — State management
- **Tailwind CSS** + **shadcn-nuxt** — Styling and UI components
- **Playwright** — E2E testing
- **TypeScript**

### Infrastructure

- **Docker Compose** — Local development environment

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (if running without Docker)

### Running with Docker (recommended)

```bash
docker compose up
```

This starts all three services:

| Service    | URL                     |
| ---------- | ----------------------- |
| Frontend   | http://localhost:4000   |
| API        | http://localhost:3000   |
| PostgreSQL | localhost:5432          |

### Running without Docker

**1. Start PostgreSQL** and create a database named `matchsoccer`.

**2. Backend**

```bash
cd api
npm install
npx prisma migrate dev
npm run start:dev
```

The API will be available at `http://localhost:3000`.

**3. Frontend**

```bash
cd app
npm install
npm run dev
```

The app will be available at `http://localhost:4000`.

### Environment Variables

| Variable           | Service  | Default                  | Description              |
| ------------------ | -------- | ------------------------ | ------------------------ |
| `DATABASE_URL`     | API      | *(set in docker-compose)* | PostgreSQL connection string |
| `API_BASE_URL`     | Frontend | `http://localhost:3000`  | Backend URL (server-side) |

## Running Tests

```bash
# Backend unit tests
cd api && npm test

# Backend E2E tests
cd api && npm run test:e2e

# Frontend E2E tests
cd app && npm run test:e2e
```

## Project Structure

```
matchsoccer/
├── api/                  # NestJS backend
│   ├── src/
│   │   ├── engines/      # Business logic (ELO, ranking, rotation)
│   │   └── ...           # Domain modules (players, teams, matches, etc.)
│   ├── prisma/           # Schema and migrations
│   └── test/             # E2E tests
├── app/                  # Nuxt 3 frontend
│   ├── pages/            # File-based routing
│   ├── components/       # Vue components
│   ├── composables/      # Shared logic
│   └── stores/           # Pinia stores
└── docker-compose.yml
```
