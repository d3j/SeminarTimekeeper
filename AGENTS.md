# Repository Guidelines

## Project Structure & Module Organization
Keep `design.md` as the canonical product blueprint; update it before structural changes land. Place runtime assets under `src/`: `src/index.html` for layout, `src/styles/` for theme CSS, `src/scripts/` for timer logic, and `src/assets/` for icons or audio cues. Mirror UI-level integration fixtures inside `public/`, which is what we ship to static hosting. House automated checks in `tests/`, matching the relative path from `src/` (e.g., `src/scripts/timer.js` → `tests/scripts/timer.test.js`).

## Build, Test, and Development Commands
We standardise on Node 20.x with npm. After cloning, install dependencies once via `npm install`. Use `npm run dev` to start the Vite dev server with hot reload, `npm run build` to produce the static bundle under `dist/`, and `npm run preview` for a production smoke test. Keep `npm run lint` wired to ESLint + Prettier and `npm run test` to execute the Vitest suite; add additional scripts instead of ad-hoc commands in documentation.

## Coding Style & Naming Conventions
JavaScript modules use ES modules with 2-space indentation, `camelCase` for functions, and `PascalCase` for exported component factories. CSS follows BEM-style class names (`tk-block__element--modifier`) and `kebab-case` filenames. Run Prettier before every commit; configuration lives in `.prettierrc`. Avoid introducing new third-party libraries without updating `design.md` and documenting the rationale.

## Testing Guidelines
Author fast unit tests in Vitest alongside the timer utilities and DOM presenters; heavier DOM interactions can use Testing Library within the same framework. Target ≥85% statement coverage on timing utilities and ≥70% overall. Name spec files `<module>.test.js` and prefer descriptive `describe` blocks (e.g., `describe('TimerCoordinator')`). Gate merges on a clean `npm run test -- --run` and review failing screenshots or logs in the MR description.

## Commit & Pull Request Guidelines
Use Conventional Commit messages (`feat:`, `fix:`, `chore:`) with imperative subject lines. Each PR should link the relevant issue, summarise scope, list manual verification steps, and include screenshots or screen recordings for visual changes. Rebase onto `main` before requesting review, and ensure automated checks (build, lint, test) pass in CI before merge approval.
