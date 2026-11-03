# Meu Jogo

App para organizar a pelada semanal: presença, sorteio de times, partida ao vivo, placar, ELO e temporada.

Monorepo pnpm + Turbo.

| Pasta | Pacote | O que é |
|---|---|---|
| `packages/ui` | `@meujogo/ui` | Design system: tema (tokens), componentes shadcn/ui sobre Base UI, componentes de tela, ícones MDI |
| `packages/brand` | `@meujogo/brand` | Logo, padrões gráficos e emblemas em arquivo final |
| `apps/styleguide` | `@meujogo/styleguide` | Vitrine do design system |

```sh
corepack enable          # usa o pnpm fixado em package.json
pnpm install
pnpm --filter @meujogo/styleguide dev
pnpm typecheck
```

O protótipo NestJS + Nuxt está congelado na branch `prototype-final` (tag `prototype-v1`).
