# Volleyball Statistics App — Product Readiness Report
> **Audited:** June 20, 2026 | **Auditor:** Senior Software Architect (Antigravity AI)
> **Frontend:** `c:\Volley\statsapp` (Angular 18) | **Backend:** `c:\Volley\serve\backend` (Node.js/Express + MySQL/Sequelize)

---

## 1. Executive Summary

This volleyball statistics application is a **working internal tool that has NOT been hardened for commercial sale**. The core stat-tracking, match management, player management, and team management workflows function end-to-end, and the app is visibly deployed at `nervagest.ma`. However, critical production credentials (Google service-account private key, database password) are committed in plaintext to the repository; there are zero automated tests; no rate limiting, helmet headers, or CSRF protection exist; the codebase is saturated with `console.log` debug statements; the "isModerator" middleware checks for a role called `"entrenador"` that doesn't exist in the seeded roles table; and the CI/CD pipeline uses a broken build command (`ng run build:prod`). Furthermore there is no payment system, no multi-tenancy, no onboarding flow, no landing page with a call-to-action, and no analytics — all of which are table-stakes for a sellable SaaS product. The product has genuine value as a sports-analytics platform but requires at minimum 2–3 months of hardening before it can be offered commercially.

---

## 2. Phase 1 — Codebase Discovery & Mapping

### 2.1 Project Structure

```
statsapp/ (Angular 18 SPA)
├── src/app/
│   ├── _services/          auth.service, storage.service, user.service
│   ├── services/           match.service, player.service, fault-type.service, modal-service, boolean.service
│   ├── helpers/            htttp.interceptor.ts   ← typo in filename
│   ├── auth/               role.guard.ts
│   ├── models/             match.model.ts
│   ├── types/
│   ├── entrenador.guard.ts
│   ├── role.directive.ts
│   └── [49 component folders]
├── src/environments/       environment.ts, environment.development.ts
├── azure-pipelines.yml     (broken CI)
├── vercel.json             (static hosting config)
└── deploy.bat

backend/ (Node.js/Express 4 + Sequelize 6 + MySQL)
├── controllers/            11 controllers
├── routes/                 13 route files
├── model/                  19 model files (no migrations directory)
├── middleware/             authJwt.js, verifySignUp.js, index.js
├── config/                 auth.config.js, db.config.js
├── app.js                  main entry point
├── ecosystem.config.js     PM2 config
├── development.env         ← credentials in repo
├── production.env          ← LIVE CREDENTIALS IN REPO
├── google.env              ← GOOGLE PRIVATE KEY IN REPO
└── voleibol-441715-*.json  ← GOOGLE SERVICE ACCOUNT JSON IN REPO
```

### 2.2 Angular Components (49 total)

| Component | Purpose |
|---|---|
| `first` | Landing page (Three.js 3D volleyball court) |
| `login` / `register` | Auth forms |
| `home` | Dashboard |
| `match-live` | Live match scoring interface |
| `editor` | Video + annotation editor (YouTube + canvas) |
| `details-page` | Per-match stats |
| `match-details` / `match-details-xdd` | Match list views |
| `player-list` / `add-player` | Player management |
| `add-team` / `teams-manager` | Team management |
| `new-match` / `new-match1` | Match creation forms |
| `marcador` | Live scoreboard |
| `resumen-partido` | Match summary |
| `actions-resume` | Serve/receive/attack/set analytics |
| `evaluar` | Player evaluation |
| `reward` / `dialogo-recompensa` | Gamification/rewards |
| `annotation-canvas` / `annotation-toolbar` / `annotation-list` | Drawing annotations on video |
| `set-map` | Set-by-set visualization |
| `descargar-resumen` | PDF/Excel export |
| `board-admin` / `board-moderator` / `board-user` | Role-board stubs |
| `sexteto` / `canvas` / `sonia` | Experimental/dev components |
| `profile` / `user-manager` | User profile and admin user management |
| `player-details-dialog` / `player-list-modal` | Dialogs |
| `youtube-player` | YouTube wrapper |
| `choose-players` / `modal-rece` / `detalles-modal` | Supporting dialogs |
| `right-overlay` | Editor overlay panel |
| `confirm-dialog` | Generic confirmation dialog |
| `models` | Unused stub component |

### 2.3 Backend Routes (full map)

| Method | Path | Auth | Controller |
|---|---|---|---|
| POST | `/api/auth/signup` | public + verifySignUp | auth.signup |
| POST | `/api/auth/signin` | public | auth.signin |
| POST | `/api/auth/signout` | — | auth.signout |
| GET | `/api/test/all` | public | user.allAccess |
| GET | `/api/test/user` | verifyToken | user.userBoard |
| GET | `/api/test/mod` | verifyToken + isModerator | user.moderatorBoard |
| GET | `/api/test/admin` | verifyToken + isAdmin | user.adminBoard |
| GET | `/api/users/getAll` | verifyToken + getUserRole | user.getUsers |
| PUT | `/api/users/assignUserToPlayer` | verifyToken + isModeratorOrAdmin | players.assignUserToPlayer |
| PUT | `/api/users/updaterole/:userId` | verifyToken + isAdmin | user.updateUserRoles |
| POST | `/api/partidos/user` | verifyToken + isModeratorOrAdmin | partido.createMatch |
| GET | `/api/partidos/user` | verifyToken | partido.findByUser |
| GET | `/api/latest-match-details` | verifyToken | partido.detallesUltimos |
| DELETE | `/api/borrar-partido/:matchId` | verifyToken + isModeratorOrAdmin | partido.deleteMatch |
| GET | `/api/partidos/:matchId/details` | verifyToken | partido.getMatchDetails |
| PUT | `/api/partidos/:matchId/youtube` | verifyToken + isModeratorOrAdmin | partido.updateYoutubeId |
| GET | `/api/partidos/:matchId/youtube` | verifyToken | partido.getYoutubeId |
| PUT | `/api/partidos/:matchId/matchevent/lastRequest` | verifyToken | partido.updateLastRequest |
| PUT | `/api/partidos/:matchId/matchevents/lastRequest` | verifyToken | partido.updateMatchEventsLastRequest |
| POST | `/api/matchevent/user` | verifyToken + isModeratorOrAdmin | matchevent.createEvent |
| GET | `/api/matchevent/:matchId` | verifyToken | matchevent.getEventDetails |
| GET | `/api/matchevent2/:matchId` | verifyToken | matchevent.getEventDetails2 |
| GET | `/api/matchevent3/:matchId` | verifyToken | matchevent.getEventDetails3 |
| GET | `/api/lastevents/:matchId` | **NONE** | matchevent.ultimoseventos |
| GET | `/api/resumen/jugador/:matchId` | verifyToken | matchevent.resumenJugador |
| DELETE | `/api/matchevents/delete-last` | verifyToken | delete.borrarevento |
| GET | `/api/matchevents/getLatest` | verifyToken | matchevent.obtenerUltimoevento |
| GET | `/api/marcador` | **NONE** | matchevent.marcador |
| GET | `/api/resumenTemporada` | verifyToken | matchevent.resumenTemporada |
| GET | `/api/resumenTemporadaPorFallos` | verifyToken | matchevent.resumenTemporadaPorFallos |
| GET | `/api/resumenTemporadaPorPartido` | verifyToken | matchevent.resumenTemporadaPorPartido |
| GET | `/api/clasificacion/:equipoId` | verifyToken | matchevent.getOldestUserIdForTeam |
| GET | `/api/puntoxpunto/:id` | **NONE** | matchevent.puntoapunto |
| PUT | `/api/matchevents/editar/:id` | verifyToken + isModeratorOrAdmin | matchevent.editarEvento |
| GET | `/api/matchevents/obtener/:matchId` | verifyToken | matchevent.anotaciones |
| POST | `/api/matchevents/nueva/anotacion` | verifyToken | matchevent.nuevaAnotacion |
| GET | `/api/players` | verifyToken | players.findPlayers |
| GET | `/api/players/:teamId` | verifyToken | players.findTeamPlayers |
| POST | `/api/players` | verifyToken + isModeratorOrAdmin | players.createPlayer |
| GET | `/api/positions` | public | positions.findAll |
| GET | `/api/faulttypes/all` | public | faulttype.getAll |
| POST | `/api/team` | verifyToken + isModeratorOrAdmin | equipo.equipo |
| GET | `/api/getTeams` | verifyToken | equipo.obtenerEquipo |
| GET | `/api/getTeams1` | **NONE** | equipo.obtenerEquipos |
| GET/POST | `/api/rewards` | verifyToken | reward |
| GET/POST | `/api/pointslog` | verifyToken | reward |
| GET/POST | `/api/actions` | verifyToken | actions |
| GET | `/api/actions/saque/:matchId` | verifyToken | actions.getSaques |
| GET | `/api/actions/rece/:matchId` | verifyToken | actions.getReces |
| GET | `/api/actions/ataque/:matchId` | verifyToken | actions.getAtaques |
| GET | `/api/actions/colocaciones/:matchId` | verifyToken | actions.getColocaciones |
| GET | `/events` | **NONE** | Google Calendar |

### 2.4 Database Models

MySQL via Sequelize (no migration files — uses `sync({ alter: true })` in dev):

`users`, `roles`, `user_roles` (junction), `equipos` (teams), `user_teams` (junction), `players`, `positions`, `datospartido` (matches), `matchevents`, `faulttypes`, `annotations`, `anotaciones` (canvas JSON), `rotaciones`, `rewards`, `pointslog`, `rewardlog`, `action_types`, `action_ratings`, `action_registers`

> **⚠️ No migration system.** Schema is managed by `sequelize.sync()` auto-alter — this is dangerous in production and causes data integrity risks.

### 2.5 Third-Party Integrations

| Integration | Purpose | Status |
|---|---|---|
| Google Calendar API | Display team calendar events | Integrated (credentials leaked) |
| YouTube Player API | Embed match video in editor | Working |
| Three.js + GSAP | 3D landing page | Working |
| Socket.io | Required in `app.js` but never used | Dead dependency |
| Mongoose | Listed in `package.json`, never used | Dead dependency |
| Angular Material | UI component library | Used throughout |
| ngx-charts / ngx-echarts | Charts for stats | Used |
| ExcelJS / jsPDF | Export reports | Used |
| html2canvas | Screenshot for PDF | Used |

### 2.6 Environment Variables

| Variable | Source | Notes |
|---|---|---|
| `NODE_ENV` | all envs | switches dev/prod |
| `HOST` | dev.env / prod.env | DB host |
| `PORT` | dev/prod | HTTP server port |
| `DB_NAME` | dev/prod | `appstats` |
| `SQLUSER` | dev/prod | **Committed in repo** |
| `PASS` | dev/prod | **Committed in repo** |
| `JWT_SECRET` | NOT SET anywhere | Falls back to literal `"change-me-in-env"` |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | prod.env / google.env | **Full private key committed** |

### 2.7 Scripts & CI/CD

- **Backend:** `npm run dev` / `npm run prod` — simple node commands, no nodemon
- **Frontend:** `ng serve`, `ng build`, `ng test`, `ng lint`
- **CI:** Azure Pipelines (`azure-pipelines.yml`) — calls `ng run build:prod` which is **invalid** (correct command is `ng build --configuration=production`)
- **Deployment:** PM2 via `ecosystem.config.js`; deploy.bat for manual FTP-style push
- **No Docker, no docker-compose, no automated backend CI pipeline**

---

## 3. Phase 2 — Functional Analysis

### 3.1 Feature Completion Map

| Feature | Status | Blocker / Notes |
|---|---|---|
| User Registration | ✅ Complete | No email verification |
| User Login / JWT | ✅ Complete | JWT secret is hardcoded fallback |
| User Logout | ✅ Complete | — |
| Role Management (admin/entrenador/user) | ⚠️ Partial | `isModerator` checks for role `"entrenador"` but seeded roles are `"user"`, `"moderator"`, `"admin"` — mismatch |
| Team Creation | ✅ Complete | Auto-creates "Rival" placeholder player |
| Player Creation | ✅ Complete | Good input validation |
| Player-User Assignment | ✅ Complete | — |
| Match Creation | ✅ Complete | Local team hardcoded as `"Roche"` |
| Live Match Scoring | ✅ Complete | Core feature, well-implemented |
| Match Event Recording | ✅ Complete | Serve/receive/attack/set tracking |
| Match Event Undo (delete last) | ✅ Complete | — |
| Match Event Edit | ✅ Complete | — |
| Video Annotation Editor | ✅ Complete | YouTube embed + canvas drawing |
| Text Annotations per Point | ✅ Complete | — |
| Per-Match Stats (charts) | ✅ Complete | — |
| Season Summary Stats | ⚠️ Partial | `resumenTemporadaPorPartido` SQL references `datospartido` table by name — brittle |
| Actions System (serve/receive/attack/set ratings) | ✅ Complete | Well-structured |
| Player Performance Export (PDF/Excel) | ⚠️ Partial | `descargar-resumen` component exists; completeness unclear |
| Set-Map Visualization | ⚠️ Partial | Component exists; depends on data shape |
| Rewards / Gamification | ⚠️ Partial | Backend fully built; frontend UI is basic |
| Points Log | ✅ Complete | — |
| Google Calendar Events | ⚠️ Partial | Backend works; frontend call exists but no dedicated page |
| User Manager (admin) | ⚠️ Partial | Only admins see it; no pagination |
| Landing Page (3D) | ✅ Complete | Three.js volleyball court, GSAP scroll animations |
| 404 / Error Pages | ❌ Missing | `error-505` route goes to `TeamsManagerComponent` — wrong component |
| Token Refresh | ❌ Missing | 24-hour JWT, no refresh mechanism |
| Password Reset | ❌ Missing | — |
| Email Notifications | ❌ Missing | — |
| Mobile Responsive Layout | ⚠️ Partial | Breakpoint observer exists; editor likely unusable on mobile |

### 3.2 Hardcoded Values That Should Be Configurable

- `equipo_local: "Roche"` in `partido.controller.js` — team name is hardcoded for every match
- Cookie session key hardcoded as `"COOKIE_SECRET"` in `app.js`
- Google Calendar ID `48hhd42lpargvbie892qgdgglo@group.calendar.google.com` in `app.js`
- Production server IP `5.135.153.89` in `production.env`
- UUID `b5714ba1-a1d7-4f7f-8558-5dbb1cc95a98` hardcoded in `first.component.ts`

### 3.3 Dead Code / Orphaned Elements

- `MatchDetailsXddComponent` — declared in module, not routed
- `ModelsComponent` — declared in module, not routed, appears empty
- `SoniaComponent` — declared in module, not routed
- `BoardModeratorComponent` / `BoardUserComponent` — declared, not routed
- `socket.io` — imported in `app.js`, `server` created, but Socket.io is never initialized or used
- `mongoose` — listed as dependency, never imported
- `partido.js` route file — empty or duplicate route file that does nothing (318 bytes, no routes)
- `matchRoutes.js` — route file not included in `app.js`, completely orphaned
- Stray files in `backend/`: `500).length`, `console.log('ROOT_ERR'`, `out.push({name`, `x.status`, `{` — these appear to be shell output fragments accidentally committed

### 3.4 TODO/FIXME/HACK Comments

- No formal TODO/FIXME comments found. However, there are **200+ `console.log` statements** across the frontend, particularly concentrated in `editor.component.ts` (50+ statements).

---

## 4. Phase 3 — Quality & Security Audit

> [!CAUTION]
> Multiple critical security issues were found. None are minor.

### 4.1 Exposed Secrets (CRITICAL — P0)

| Secret | Location | Risk |
|---|---|---|
| Google Service Account Private Key | `production.env` (line 12) & `google.env` | Full Google Cloud access; immediate revoke required |
| Google Service Account JSON | `voleibol-441715-4ff6d69349cd.json` | Same key, different format |
| Production DB Password `S8AkkrGOuyauC6Qj` | `production.env` (line 7) | Direct database access |
| Development DB Password `locoplaya` | `development.env` (line 7) | Local DB compromise |
| Production DB User `voleyuser` | `production.env` | — |
| Production Server IP `5.135.153.89` | `production.env` | Targeted attacks |
| JWT Secret | Falls back to `"change-me-in-env"` (auth.config.js) | Token forgery possible |
| Cookie Session Key | Hardcoded `"COOKIE_SECRET"` in app.js | Session hijacking |

**ALL of the above must be rotated immediately and removed from git history.**

### 4.2 Authentication & Authorization

| Issue | Severity |
|---|---|
| `isModerator` middleware checks for role `"entrenador"` but the roles table seeds `"user"`, `"moderator"`, `"admin"` — making the moderator check always fail | **P1** |
| `esAdmin` function in `authJwt.js` calls `res.stats(403)` (typo — should be `res.status`) — this function will crash on any call | **P1** |
| JWT has 24-hour expiry with no refresh token — once expired, users must re-login | P2 |
| Cookie session and JWT are used simultaneously but inconsistently | P2 |
| `/api/lastevents/:matchId`, `/api/marcador`, `/api/puntoxpunto/:id`, `/api/getTeams1` have **no authentication** — any anonymous user can read match data | **P1** |
| `signout` uses `this.next(err)` which will throw a ReferenceError (`this` is wrong context) | P1 |

### 4.3 Injection & XSS

| Issue | Severity |
|---|---|
| All Sequelize parameterized queries use `:replacements` correctly — SQL injection risk is low | ✅ OK |
| No output sanitization on Angular templates (using `{{ }}` which escapes by default) | ✅ OK |
| No CSRF protection — all state-changing endpoints use JWT in Authorization header only (acceptable if no cookie-auth is used, but cookies ARE used for session) | P1 |
| No `helmet` middleware — missing `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy` headers | **P1** |

### 4.4 CORS

```js
origin: ['http://localhost:4200','https://nervagest.ma','https://www.nervagest.ma']
credentials: true
```
CORS is properly restrictive — not a vulnerability.

### 4.5 Password & JWT Handling

- Passwords: `bcrypt` with `saltRounds=8` — acceptable (10 is recommended)
- JWT: `allowInsecureKeySizes: true` flag set — explicitly allows weak secrets, dangerous
- No account lockout after failed logins
- No brute-force protection

### 4.6 Rate Limiting

**Zero rate limiting** exists anywhere in the application. Any endpoint can be called without restriction.

### 4.7 Error Handling Gaps

- `signout` controller: `this.next(err)` — will crash (P1 bug)
- `equipo.controller.js` `obtenerEquipos()` has no try/catch — uncaught DB errors crash the process
- `ultimoseventos` throws errors instead of returning them — calling code may crash
- `matchRoutes.js` is never registered — orphaned file

### 4.8 Input Validation

| Controller | Validation |
|---|---|
| `players.createPlayer` | ✅ Good — validates name, position, team, dorsal |
| `actions.post` | ✅ Good — validates action_type_id, rating_id, team_id |
| `auth.signup` | ❌ No password length/complexity check |
| `auth.signin` | ❌ No username format check |
| `partido.createMatch` | ❌ No date format or future-date validation |
| `matchevent.createEvent` | ❌ No score range validation |
| `equipo.equipo` | ❌ No team name length/uniqueness validation |

---

## 5. Phase 4 — Testing

### 5.1 Existing Tests

The frontend has the Angular Karma/Jasmine test framework configured with these spec files:
- `app.component.spec.ts`
- `annotation.service.spec.ts`
- `youtube.service.spec.ts`
- `entrenador.guard.spec.ts`
- `role.directive.spec.ts`
- `_services/*.spec.ts` (auth, storage, user)
- `services/*.spec.ts` (match, player, fault-type, modal)

**All spec files are auto-generated stubs — none contain real test cases.**

```typescript
// Example from auth.service.spec.ts (all specs look like this):
it('should be created', () => {
  expect(service).toBeTruthy();
});
```

The backend `package.json` test script is literally:
```json
"test": "echo \"Error: no test specified\" && exit 1"
```

### 5.2 Test Coverage

- **Backend:** 0% — no test framework installed, no test files
- **Frontend:** ~0% effective — only auto-generated "created" checks

### 5.3 Tests That Should Exist But Don't

- Authentication flow (register, login, logout, expired token)
- JWT verification middleware
- Role-based access control (the broken `isModerator` would be caught immediately)
- Match CRUD operations
- Player CRUD with validation
- Score calculation logic
- Actions recording and retrieval
- Reward redemption logic (concurrency risk — no transaction used)
- Guard behavior for unauthorized access
- Angular form validation

---

## 6. Phase 5 — Performance & Scalability

### 6.1 N+1 Query Problems

| Location | Issue |
|---|---|
| `partido.controller.js` `findByUser` | Fetches user → gets team IDs → fetches matches — 3 queries, acceptable with small data |
| `players.controller.js` `findPlayers` | 3-step query chain (user→teams→users→players) — N+1 risk at scale |
| `authJwt.js` every middleware call | `User.findByPk` + `user.getRoles()` on every authenticated request — 2 DB calls per request with no caching |

### 6.2 Missing Indexes

No explicit index definitions are in any model file. Sequelize will not auto-create indexes on foreign keys in all cases. Missing indexes on:
- `matchevents.matchId` (queried on every match-event fetch)
- `matchevents.playerId`
- `action_registers.match_id`
- `datospartido.equipoId`
- `players.equipoId`

### 6.3 Pagination

- `/api/matchevent/:matchId` — returns ALL events for a match with no limit (can be thousands)
- `/api/users/getAll` — returns all users with no pagination
- `/api/players` — returns all players with no pagination
- `ultimoseventos` has `LIMIT 15` — only correct paginated endpoint

### 6.4 Angular Bundle Size

- Heavy dependency tree: Three.js, GSAP, ECharts, ngx-charts, ExcelJS, jsPDF, html2canvas, jQuery, heatmap.js
- No lazy loading — all components are loaded eagerly in one `AppModule`
- No `RouterModule.forRoot` with lazy loaded routes
- Expected initial bundle: **>3MB** — significantly above recommended 500KB

### 6.5 Caching

- Zero server-side caching
- Zero client-side caching (no HTTP cache headers, no service worker)

### 6.6 Memory Leaks

- `first.component.ts`: `requestAnimationFrame` loop runs forever; `window.addEventListener('resize')` and `window.addEventListener('scroll')` are never removed on component destroy — **memory leak**
- `app.component.ts`: Correctly uses `takeUntil(destroy$)` pattern — ✅
- Multiple components likely subscribe to Observables without unsubscribing (would need full audit of all 49 components)

### 6.7 Blocking Operations

- `fs.readFileSync()` used to load Google service account JSON at startup — acceptable (startup only)
- All database operations correctly use async/await — ✅

---

## 7. Phase 6 — UX / Product Completeness

### 7.1 Empty States

| Screen | Empty State Implemented? |
|---|---|
| Match list (no matches yet) | Returns 404 from API — no friendly UI state |
| Player list (no players) | Returns 404 from API — frontend likely shows nothing |
| Stats charts (no data) | Charts may render empty — unclear fallback |
| Rewards (no rewards defined) | Likely renders empty list |

### 7.2 Loading States

- Match live component and editor: No visible loading spinners documented
- Most components likely show nothing while data loads — no skeleton screens

### 7.3 Error Pages

| Route | Component | Issue |
|---|---|---|
| `/error-505` | `TeamsManagerComponent` | **Wrong component** — guard redirects send users to the teams manager instead of an error page |
| No 404 catch-all route | — | Any unknown URL shows blank page |
| No 403, 500 error pages | — | — |

### 7.4 Broken Navigation

- `MatchDetailsXddComponent`, `ModelsComponent`, `SoniaComponent`, `BoardModeratorComponent`, `BoardUserComponent` are declared but not routed — unreachable dead UI
- `new-match1` is routed but guard-free — different from the guarded `new-match`

### 7.5 Responsiveness

- Landing page uses Three.js full-screen canvas — mobile browsers may struggle
- `first.component.ts` detects portrait/landscape orientation correctly
- The `editor` component (YouTube + canvas annotations) is almost certainly unusable on phones
- Angular Material components have baseline responsiveness

### 7.6 Accessibility

- No ARIA labels found in component templates (not checked exhaustively)
- No skip-navigation links
- Contrast ratios unknown without visual inspection

### 7.7 User Feedback

- No global error toast infrastructure visible
- `MatSnackBarModule` is imported — may be used in individual components
- No success/failure confirmation dialogs on match deletion (only a generic `confirm-dialog` component exists)

---

## 8. Phase 7 — Deployment & DevOps Readiness

### 8.1 Containerization

- **No Dockerfile, no docker-compose** for either service
- Manual deployment via `deploy.bat` (appears to be an FTP or file-copy script)

### 8.2 CI/CD Pipeline

- Azure Pipelines exists for the frontend
- **Build command `ng run build:prod` is invalid** — should be `ng build --configuration=production`
- Pipeline publishes to wrong path `$(Build.SourcesDIrectory)` (typo: `SourcesDIrectory`)
- No backend CI pipeline at all
- No automated test step in the pipeline

### 8.3 Environments

- `development.env` and `production.env` exist — two environments ✅
- No staging environment

### 8.4 Logging

- **Only `console.log` and `console.error`** — no structured logging (Winston, Pino, etc.)
- 200+ debug `console.log` statements in production code
- No log aggregation, no log rotation

### 8.5 Health Check

- No `/health` or `/ping` endpoint — PM2 cannot perform HTTP health checks

### 8.6 README

- Frontend README is the default Angular CLI README — no application-specific setup instructions
- No backend README at all
- No documentation of environment variables, required database setup, or deployment process

### 8.7 Database Migrations

- **No migrations** — uses `sequelize.sync({ alter: true })` in development
- In production the code uses `sequelize.sync({})` (no alter) — schema changes require manual SQL or server restart
- No `sequelize-cli` migration files despite it being a dependency

---

## 9. Phase 8 — Monetization & Market Readiness

### 9.1 Payment System

**None.** No Stripe, no PayPal, no subscription management of any kind.

### 9.2 Subscription / Plan Model

**None.** No pricing tiers, no feature flags, no plan limits in the data model.

### 9.3 User Role Management

Three roles exist: `user`, `admin`, `moderator`. A fourth `entrenador` is used inconsistently. The role seeding does not create `entrenador` — this is a bug that blocks the coach workflow.

### 9.4 Multi-Tenancy

**Partial and single-purpose.** Each user belongs to teams via `user_teams`. Teams are isolated per user. However:
- The local team name is hardcoded as `"Roche"` for every match
- No organization/club concept — a club with multiple coaches cannot share data
- No data isolation enforcement at the API level for all endpoints

### 9.5 Onboarding Flow

**None.** New users see the login/register form. There is no guided setup wizard, no welcome email, no tutorial.

### 9.6 Analytics & Usage Tracking

**None.** No Google Analytics, Mixpanel, Posthog, or equivalent.

### 9.7 Landing Page / Marketing

- A visually impressive 3D Three.js landing page exists at the root route
- It showcases the product concept but has no pricing section, no feature comparison, no testimonials, no clear CTA beyond a login link
- The app title in `package.json` is still the auto-generated name `"lawea"` — not a product name

---

## 10. Critical Bugs & Security Issues (Prioritized)

### P0 — Immediate / Data Breach Risk

| # | Issue | Location |
|---|---|---|
| 1 | Full Google Cloud private key committed to git repository | `production.env`, `google.env`, `voleibol-441715-*.json` |
| 2 | Live production database password committed | `production.env` |
| 3 | JWT secret falls back to `"change-me-in-env"` | `config/auth.config.js` + no env var set |
| 4 | Cookie session key hardcoded in source | `app.js` line 46 |

### P1 — Functional Blockers / Security Issues

| # | Issue | Location |
|---|---|---|
| 5 | `isModerator` checks role `"entrenador"` but role doesn't exist in DB — coach users cannot create matches or record events | `middleware/authJwt.js` |
| 6 | `signout` controller calls `this.next(err)` — crashes on error | `controllers/auth.controller.js` |
| 7 | `esAdmin` function calls `res.stats(403)` (typo) — crashes on call | `middleware/authJwt.js` |
| 8 | `/api/lastevents`, `/api/marcador`, `/api/puntoxpunto`, `/api/getTeams1` have no auth | Multiple routes |
| 9 | No `helmet` headers — missing all standard security headers | `app.js` |
| 10 | No rate limiting anywhere — brute-force and DoS attacks possible | Entire API |
| 11 | Azure CI pipeline build command is broken | `azure-pipelines.yml` |
| 12 | `error-505` route maps to `TeamsManagerComponent` instead of an error page | `app-routing.module.ts` |
| 13 | No catch-all 404 route | `app-routing.module.ts` |
| 14 | `matchRoutes.js` is never registered in `app.js` — orphaned routes | `routes/matchRoutes.js` |

### P2 — Quality / Polish Issues

| # | Issue |
|---|---|
| 15 | 200+ `console.log` statements throughout production code |
| 16 | No JWT refresh token mechanism |
| 17 | No password complexity validation at signup |
| 18 | Local team name `"Roche"` hardcoded in match creation |
| 19 | No pagination on large data endpoints |
| 20 | No database indexes on FK columns |
| 21 | Memory leaks in `first.component.ts` (event listeners, animation frame loop) |
| 22 | No error pages (404, 403, 500) |
| 23 | Angular bundle not lazy-loaded — poor initial load time |
| 24 | No structured logging system |
| 25 | No health check endpoint |
| 26 | stray shell-output files committed to repository (`500).length`, etc.) |

---

## 11. Test Results Summary

| Test Type | Tests Written | Tests Passing | Coverage |
|---|---|---|---|
| Backend Unit Tests | 0 | N/A | 0% |
| Backend Integration Tests | 0 | N/A | 0% |
| Frontend Unit Tests | 14 spec files (stubs only) | All pass (trivially) | ~0% real |
| Frontend E2E Tests | 0 | N/A | 0% |
| **Overall** | **0 real tests** | — | **~0%** |

---

## 12. Gap Analysis for Market Readiness

| Gap | Priority | Estimated Effort |
|---|---|---|
| Rotate all leaked credentials + audit git history | P0 | 4 hours |
| Fix `isModerator` / `entrenador` role mismatch | P0 | 2 hours |
| Fix `signout` and `esAdmin` crashes | P0 | 1 hour |
| Add `helmet` security headers | P1 | 2 hours |
| Add rate limiting (`express-rate-limit`) | P1 | 4 hours |
| Protect anonymous endpoints | P1 | 4 hours |
| Fix CI/CD pipeline | P1 | 4 hours |
| Remove all `console.log` from production code | P1 | 1 day |
| Add structured logging (Winston/Pino) | P1 | 1 day |
| Add health check endpoint | P1 | 2 hours |
| Add JWT secret to environment | P1 | 1 hour |
| Create proper 404/403/500 error pages | P1 | 1 day |
| Fix `error-505` route to correct component | P1 | 1 hour |
| Add pagination to large endpoints | P2 | 1 day |
| Add database indexes | P2 | 4 hours |
| Remove hardcoded `"Roche"` team name | P2 | 2 hours |
| Add Sequelize migrations | P2 | 3 days |
| Implement JWT refresh tokens | P2 | 2 days |
| Add password strength validation | P2 | 4 hours |
| Write backend test suite (minimum 60% coverage) | P2 | 2 weeks |
| Write frontend test suite (minimum 60% coverage) | P2 | 2 weeks |
| Implement lazy loading in Angular router | P2 | 1 day |
| Fix memory leaks in landing page component | P2 | 4 hours |
| Add Docker + docker-compose | P2 | 1 day |
| Add staging environment | P2 | 2 days |
| Remove dead code (Mongoose, socket.io, orphaned components) | P2 | 1 day |
| **Payment integration (Stripe)** | **BLOCKER for SaaS** | **1–2 weeks** |
| **Subscription / plan model** | **BLOCKER for SaaS** | **1 week** |
| **Fix multi-tenancy (remove "Roche" hardcode, add org concept)** | **BLOCKER for SaaS** | **1 week** |
| **Onboarding flow** | **Required for SaaS** | **1 week** |
| **Analytics/usage tracking** | **Required for SaaS** | **3 days** |
| **Product README + deployment docs** | **Required for SaaS** | **2 days** |
| **Email system (verification, password reset, notifications)** | **Required for SaaS** | **3 days** |
| **Proper product branding (replace "lawea")** | **Required for SaaS** | **1 day** |

**Total estimated effort to MVP-sellable state: ~8–10 weeks of 1 developer full-time.**

---

## 13. Recommended Roadmap (Ordered)

### Week 1 — Security Hardening (Non-Negotiable)
1. Rotate all leaked credentials (Google key, DB password) — **TODAY**
2. Remove secrets from git history (`git filter-repo` or BFG)
3. Add `JWT_SECRET` and `COOKIE_SECRET` to environment variables
4. Add `helmet` middleware
5. Add `express-rate-limit` (100 req/min on auth, 300 on general)
6. Fix `isModerator` role name mismatch
7. Fix `signout` and `esAdmin` typo bugs
8. Protect the 4 unauthenticated endpoints
9. Remove 200+ console.log statements

### Week 2 — Stability & DevOps
10. Fix CI/CD pipeline build command
11. Add health check endpoint
12. Add Winston/Pino structured logging
13. Create proper error pages (404, 403, 500)
14. Fix the `error-505` route
15. Add Docker + docker-compose
16. Set up staging environment

### Week 3 — Data Integrity
17. Implement Sequelize migrations (stop using `sync alter`)
18. Add DB indexes on FK columns
19. Add pagination to all list endpoints
20. Remove hardcoded `"Roche"` team name — make it configurable per team

### Weeks 4–5 — Multi-Tenancy & Architecture
21. Add Organization/Club concept to data model
22. Implement proper data scoping per organization
23. Add JWT refresh tokens
24. Remove dead dependencies (Mongoose, socket.io, orphaned components)
25. Implement Angular lazy loading

### Weeks 6–7 — Testing
26. Backend test suite: auth, match CRUD, player CRUD, role enforcement, actions
27. Frontend test suite: forms, guards, interceptors, service mocks

### Weeks 8–10 — Commercial Features
28. Implement Stripe subscription payment
29. Define subscription tiers (e.g., Free/Pro/Club)
30. Build onboarding wizard
31. Add analytics tracking (Posthog or similar)
32. Expand landing page with pricing, features, testimonials
33. Email system (Resend or SendGrid): verification, password reset
34. Product branding & rename

---

## 14. Sellability Score

| Dimension | Score | Notes |
|---|---|---|
| Core Functionality | 40/100 | Works but `isModerator` bug blocks coach flow |
| Security | 3/100 | Credentials leaked, no helmet, no rate limiting |
| Testing | 0/100 | Zero real tests |
| DevOps & Deployment | 10/100 | Broken CI, no Docker, no health check |
| Code Quality | 35/100 | Decent structure but saturated with debug code |
| UX Completeness | 25/100 | Missing error pages, empty states, mobile issues |
| Performance | 20/100 | No lazy loading, no pagination, no indexes |
| Market Readiness | 5/100 | No payments, no multi-tenancy, no onboarding |

### 🏐 Overall Sellability Score: **21 / 100**

> **Not sellable in current state.** The application demonstrates clear product vision and has a functional volleyball statistics core that could genuinely serve sports teams. However, committing live production credentials to git is a show-stopper that makes the current codebase legally and contractually unshippable. Beyond that, there are no tests, no payments, a broken coach-role workflow, and no infrastructure to support multiple paying customers. With focused effort (~8–10 dev-weeks), this could reach a defensible **65–70/100** sellable state as a niche B2B SaaS targeting amateur and semi-professional volleyball clubs.
