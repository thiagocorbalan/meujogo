# Meu Jogo

App para organizar a pelada semanal: presença, sorteio de times, partida ao vivo, placar, ELO e temporada.

Monorepo pnpm + Turbo, Node 22.9 ou mais novo.

| Pasta | Pacote | O que é |
|---|---|---|
| `apps/web` | `@meujogo/web` | Front em Next.js (App Router), porta 8080 |
| `apps/api` | `@meujogo/api` | API em NestJS, porta 5000 |
| `apps/styleguide` | `@meujogo/styleguide` | Vitrine do design system, porta 5173 |
| `packages/engines` | `@meujogo/engines` | Regras de cálculo puras (sorteio, placar, ELO, estatísticas) |
| `packages/shared` | `@meujogo/shared` | Schemas Zod da API, usados pelo web e pela API |
| `packages/ui` | `@meujogo/ui` | Design system: tema, componentes shadcn/ui sobre Base UI, componentes de tela, ícones MDI |
| `packages/brand` | `@meujogo/brand` | Logo, padrões gráficos e emblemas em arquivo final |
| `packages/eslint-config` | `@meujogo/eslint-config` | Configuração de ESLint compartilhada (`base`, `node`, `react`) |

```sh
corepack enable          # usa o pnpm fixado em package.json
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

pnpm dev                              # web, api e styleguide juntos
pnpm --filter @meujogo/api dev        # só a API: http://localhost:5000/health
pnpm --filter @meujogo/web dev        # só o web: http://localhost:8080

pnpm lint && pnpm typecheck && pnpm test && pnpm build   # o gate
```

`engines` e `shared` são compilados para `dist/`; o `dev` de cada app compila as dependências antes de subir. Depois de editar um desses pacotes, rode `pnpm build` (ou reinicie o `dev`).

O protótipo NestJS + Nuxt está congelado na branch `prototype-final` (tag `prototype-v1`).
