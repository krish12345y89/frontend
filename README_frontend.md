Frontend: modular, prod/dev-ready setup

What I changed and why:
- Added ESLint + Prettier for consistent code style and quality.
- Added `.env` examples for development and production using `VITE_` prefixed variables.
- Added a central `src/config` module to read runtime envs.
- Added a small `src/services/api.js` wrapper to centralize API calls and error handling.
- Added a `src/components/index.js` barrel to encourage modular imports.

Recommended next steps:
- Run `npm install` in `frontend` to install new devDependencies.
- Run `npx husky install` (or `npm run prepare`) to enable git hooks (optional).
- Consider migrating to TypeScript and adding unit tests for enterprise readiness.
- Add CI job to run `npm run lint` and `npm run build:prod` on PRs.

Quick commands:
```powershell
cd frontend
npm install
npm run dev    # local development
npm run build:prod   # production build
```
