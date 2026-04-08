# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `artifacts/fiscal-inspector` (`@workspace/fiscal-inspector`)

**"Taxes Please"** — Papers Please-style 2D finance auditing game. Frontend-only React + Vite app served at `/`.

**Stack:** React, Vite, TypeScript, Framer Motion, Tailwind CSS, canvas-confetti, Lucide icons

**Core loop:** 7 days × 4 clients/day. Player inspects tax documents (1040, W-2, Expense, ID), spots discrepancies, and stamps APPROVE / REJECT / FREEZE. Up to 5 citations before termination.

**Financial Twist Expansion features:**
- **Three-path alignment** tracked across all decisions: Corporate Loyalist, Resistance/Whistleblower, Survivalist
- **VIP scripted clients** on Days 2, 4, 6 (Marcus Vane, Ana Reyes, Director Strauss) with world-state consequences
- **Freeze Assets** third action for financial contraband (money laundering, offshore accounts, insider trading) — earns $150 when correct
- **Leaked Memos** — encrypted intel panels appear in sidebar for fraud/contraband clients; player can Act on Intel (+bonus, alignment shift) or Discard
- **Macro-Economic Events** on Days 3, 5, 7: Market Shock (wages ×0.7), Hyperinflation ($120 cost of living deduction), Audit Sweep (bonus wages ×1.25)
- **Moral Ledger** — each decision generates a human-cost narrative shown in day-end summary
- **12 narrative endings** determined by final balance, citations, dominant alignment, and world-state flags
- **Hidden notes** tucked inside VIP documents, toggled via eye icon in client booth

**Intro Sequence:** Two phases: typewriter text on black screen → 4-page Inspector Handbook (Verification, Math Check, UV Stamp, Freeze Button). Uses Web Audio API for typewriter clicks and page-turn sounds. Clicking anywhere on the typewriter screen skips the animation instantly. Handbook has a "Skip Handbook" button. After last handbook page (or skip), transitions to the Day Start screen.

**Day Start Screen (DayStartScreen.tsx):** Ministry Check-in Document aesthetic. Dark concrete-textured background (gradient + noise overlays). Ministry of Revenue shield crest SVG at top center with eagle silhouette. "Efficiency Is Our Currency" slogan. Paper card with parchment gradient containing "Day X of 7" (Courier Prime typewriter), "TAXES PLEASE" (Georgia serif with SVG ink-bleed displacement filter). Red "ENTRY PERMITTED" stamp tilted -15° overlapping card. Wooden stamp-style "Start Shift" button bottom-right. Event notices (market shock, hyperinflation, audit sweep) shown inside the card when active. Newspaper front page phase plays first on event days (4.2s auto-advance or click).

**UV Stamp Mechanic:** Every document has a visible "Official M.O.F. Stamp" at the bottom. When the UV Scanner tool (key 2) is active and the player hovers over the stamp, it reveals hidden text: "VALID" (green) for clean documents, "FAKE" (red) for fraudulent ones. Fraudulent documents revealed as FAKE must be processed with FREEZE.

**Family System:** Family members (Elena, Mark, Lily, Rex) have statuses: OK → HUNGRY → WEAK → SICK → CRITICAL → DEAD. If unfed while SICK/CRITICAL, they decay 2 steps instead of 1. Family death triggers immediate GAME_OVER. Evening screen requires 2-second review before Continue button enables.

**Evening Screen:** Dark kitchen atmosphere with pixel art character portraits (imported via @assets/ alias), status labels, feed/medicine toggles, real-time cost animations, and auto-deducted rent/heat line. Summary bar shows fed count and savings.

**Inspector's Toolkit:** Thin 56px toolbar strip on the far-right edge. 4 numbered inventory slots (hotkeys 1-4): Calculator (functional 4-function, draggable, keyboard routing blocked when active), UV Scanner (cursor AoE purple light, activates stamp reveals), Finance Ledger (shows Current Funds + Daily Goal in large clean font), Family Monitor (shows family names + color-coded status). Clean toolbar with no bottom stats section. Escape clears active tool.

**Key files:**
- `src/types/game.ts` — full type system (alignment, macro events, VIP data, leaked memos, endings, DEAD status)
- `src/lib/narrative.ts` — VIP definitions, macro events, 12-ending matrix, human cost messages
- `src/lib/generator.ts` — procedural client generation + VIP injection + leaked memo generation
- `src/hooks/useGameEngine.ts` — full game state machine with alignment tracking, freeze, memo handling, family death
- `src/pages/IntroSequence.tsx` — pre-game intro with typewriter text + 4-page Inspector Handbook
- `src/components/workspace/InspectorToolkit.tsx` — Inspector's Toolkit: calculator, UV scanner, finance ledger, family monitor
- `src/components/forms/PaperForms.tsx` — document rendering with OfficialStamp + UV reveal mechanic
- `src/components/workspace/DraggablePaper.tsx` — draggable document wrapper, threads UV props
- `src/pages/Desk.tsx` — main game view (lineup, booth, workspace, tool overlays, day-end overlay)
- `src/pages/EveningScreen.tsx` — family feeding screen with survival mechanics
- `src/pages/EndScreen.tsx` — ending reveal with alignment bars and moral ledger

**Scoring:**
- Correct Approve: +$50
- Correct Reject: +$75 + $25×circled fields (max 4)
- Correct Freeze: +$150
- Wrong Approve: −$25 to −$50 + 1 citation
- Wrong Reject: −$10 + 1 citation
- Memo Intel bonus: +$30–$80 when acted on correctly

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
