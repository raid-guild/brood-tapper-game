# Brood Tapper

A web port of the 1983 arcade classic *Tapper*, fully rebranded for
[Raid Guild](https://www.raidguild.org/) and launched as an external module
from the Raid Guild Portal. The Tavern Keeper pours **Raid Brood** — a dark
stout in the lineage of Raid Guild's *Blood of Moloch* beer.

Design doc: [tapper-implementation-plan.md](tapper-implementation-plan.md).
Reference captures and character art: [tapper-images/](tapper-images/).

## Play

- `↑/↓` (or `W/S`) — switch bars
- `←/→` (or `A/D`) — walk along the bar (grab tips, intercept empties)
- `Space` (hold) — pour at the tap; release a full mug to send it
- `Enter` — insert coin / restart

Serve every guild member before they reach the taps. Catch the empties.
Don't waste the Brood. **3 lives.**

## Development

```bash
npm install
npm run sprites   # regenerate the character sprite sheet from the SVGs
npm run dev
```

The game is fully playable without a database or Portal session — scores
just aren't recorded. The leaderboard endpoints need `DATABASE_URL`.

### Project layout

- `game/` — framework-free engine: fixed-timestep loop, 1-D lane model,
  state machine, canvas renderer, WebAudio SFX
- `app/` — Next.js App Router: start screen, `/play`, API routes
- `lib/` — drizzle schema/client, iron-session, launch-token verification
- `assets-src/` — asset pipeline (all art is regenerable from scripts):
  - `build-character-sprites.mjs` — rasterizes the 16 character SVGs into
    `public/sprites/characters.{png,json}` (Path C)
  - `screenshot.mjs` — drives the game headlessly for side-by-side
    comparison with the reference captures

### Environment

Copy `.env.example` to `.env` and fill in:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres (Railway plugin) |
| `MODULE_LAUNCH_SECRET` | Per-module HS256 secret from the Portal CMS |
| `PORTAL_ISSUER` | Expected `iss` claim |
| `MODULE_SLUG` | Expected `aud` claim |
| `PORTAL_MODULES_URL` | Redirect target when no/invalid launch token |
| `SESSION_SECRET` | iron-session cookie encryption (32+ chars) |
| `BROOD_TAPPER_AGENT_API_TOKEN` | Bearer token for read-only agent reporting routes |

### Portal launch flow

Portal sends the player to `/api/auth/callback?token=<JWT>` (short TTL,
HS256). On success the player row is upserted (`handle` refreshed each
launch), an encrypted session cookie is set, and the player lands on the
start screen. Invalid/missing/expired tokens redirect to the Portal
modules page — that's the designed back-button path.

### Database

```bash
npm run db:generate   # regenerate SQL from lib/db/schema.ts
npm run db:migrate    # apply migrations (needs DATABASE_URL)
```

Every completed game is stored (`games`), which doubles as the audit
trail — no other anti-cheat in v1.

## Deploy (Railway)

One project: web service + Postgres plugin. `railway.json` runs
migrations as the pre-deploy command. Set the env vars above, point the
custom domain at the service, and register the callback host in the
Portal CMS (Sam has the module access key).
