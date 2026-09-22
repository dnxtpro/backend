# Implementation Plan — Volleyball App Production Hardening

This plan outlines the changes to bring the volleyball statistics application to a production-ready state. The changes will enhance security, error handling, database performance, test coverage, build pipelines, and UI defensive design, without changing the current business features, UX intent, or data model semantics.

## User Review Required

> [!WARNING]
> Credentials including database passwords and private keys previously committed to the repository must be rotated immediately.

> [!IMPORTANT]
> The `/error-505` route is currently wired to the `TeamsManagerComponent`. We will redirect it to a dedicated `ErrorPageComponent` that handles both 404 and 500/505 errors.

## Open Questions

None at this time. All information required has been gathered from the codebase and reports.

## Proposed Changes

---

### 1. Database & Models Layer

#### [MODIFY] [model index.js](file:///c:/Volley/serve/backend/model/index.js)
- Wire new index options on foreign key columns (FK columns in `matchevents`, `action_registers`, `datospartido`, and `players`).

#### [MODIFY] [matchevent.model.js](file:///c:/Volley/serve/backend/model/matchevent.model.js)
- Add database indexes on `matchId` and `playerId` columns.

#### [MODIFY] [actions_register.model.js](file:///c:/Volley/serve/backend/model/actions_register.model.js)
- Add database indexes on `match_id` and `player_id` columns.

#### [MODIFY] [partido.model.js](file:///c:/Volley/serve/backend/model/partido.model.js)
- Add database indexes on `equipoId` and `userId` columns.

#### [MODIFY] [player.model.js](file:///c:/Volley/serve/backend/model/player.model.js)
- Add database indexes on `equipoId`, `userId`, and `mainUser` columns.

---

### 2. Backend Routes, Controllers & Middleware

#### [MODIFY] [matchevents.controller.js](file:///c:/Volley/serve/backend/controllers/matchevents.controller.js)
- Update `getEventDetails` to parse and apply pagination query parameters (`size`/`limit` and `offset`) safely, falling back to full fetch for backward compatibility.
- Ensure all backend error messages return both `message` and `error` fields to preserve frontend compatibility.

#### [MODIFY] [equipo.controller.js](file:///c:/Volley/serve/backend/controllers/equipo.controller.js)
- Add validation to check if `team` name in body is non-empty.

#### [MODIFY] [partido.controller.js](file:///c:/Volley/serve/backend/controllers/partido.controller.js)
- Add validation to check if `rivalTeam` is a non-empty string, `date` is a valid date string, and `equipoId` is provided.

#### [DELETE] [matchRoutes.js](file:///c:/Volley/serve/backend/routes/matchRoutes.js)
- Delete this empty, orphaned routes file.

#### [DELETE] [partido.js](file:///c:/Volley/serve/backend/routes/partido.js)
- Delete this empty, orphaned routes file.

---

### 3. Frontend App & Routing

#### [NEW] [error-page.component.ts](file:///c:/Volley/statsapp/src/app/error-page/error-page.component.ts)
- Reusable error component showing code, message, and descriptive details depending on route data parameters.

#### [NEW] [error-page.component.html](file:///c:/Volley/statsapp/src/app/error-page/error-page.component.html)
- User interface showing an illustrative, responsive, beautiful layout for 404 / 500 error states.

#### [NEW] [error-page.component.css](file:///c:/Volley/statsapp/src/app/error-page/error-page.component.css)
- Stylings for error states with support for custom dark mode colors and buttons.

#### [MODIFY] [app.module.ts](file:///c:/Volley/statsapp/src/app/app.module.ts)
- Declare `ErrorPageComponent` in declarations.

#### [MODIFY] [app-routing.module.ts](file:///c:/Volley/statsapp/src/app/app-routing.module.ts)
- Update `error-505` to map to `ErrorPageComponent` with route data `{ type: '505' }`.
- Add a catch-all route `{ path: '**', component: ErrorPageComponent, data: { type: '404' } }`.

#### [MODIFY] [first.component.ts](file:///c:/Volley/statsapp/src/app/first/first.component.ts)
- Implement `OnDestroy` to cancel `requestAnimationFrame`, dispose of OrbitControls, Three.js WebGLRenderer, and clean up global resize/scroll event listeners.
- Add `camera.updateProjectionMatrix()` on window resize listener to fix aspect ratio issues.

---

### 4. Build Pipeline

#### [MODIFY] [azure-pipelines.yml](file:///c:/Volley/statsapp/azure-pipelines.yml)
- Change `ng run build:prod` build script to `npm run build:prod`.
- Fix typo `SourcesDIrectory` to standard `SourcesDirectory`.

---

### 5. Backend Automated Testing

#### [NEW] [player.controller.test.js](file:///c:/Volley/serve/backend/tests/player.controller.test.js)
- Unit tests for player controller (creation validation, fetching team players, mock database).

#### [NEW] [partido.controller.test.js](file:///c:/Volley/serve/backend/tests/partido.controller.test.js)
- Unit tests for partido controller (match creation with date/rival validation, delete matches).

#### [NEW] [matchevents.pagination.test.js](file:///c:/Volley/serve/backend/tests/matchevents.pagination.test.js)
- Unit tests validating that the `getEventDetails` endpoint accepts and correctly executes pagination logic with query parameters.

---

## Verification Plan

### Automated Tests
- Run backend Jest tests: `npm run test` or `npx jest tests/` in `c:/Volley/serve/backend` to verify all 33 existing tests + 3 new test suites pass successfully.

### Manual Verification
- Verify compilation of Angular app: Run `npm run build` in `c:/Volley/statsapp` to verify clean build without typescript or module resolution errors.
