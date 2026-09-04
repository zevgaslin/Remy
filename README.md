# Remy
Software Studio Project

A website that recommends what to cook for the week based on the ingredients you have on hand and their expiration dates. See [docs/requirements.md](docs/requirements.md) for personas, user stories, and MVP scope.

## Structure

- `backend/` — Spring Boot (Java) API. Entry point: `src/main/java/com/remy/backend/RemyApplication.java`. Feature endpoints go in `controller/`, data models in `model/`, data access in `repository/`.
- `frontend/` — React (Vite) app. Entry point: `src/App.jsx`. Each nav section (Pantry, Recipes, Weekly Plan, Login) is a placeholder to build out into its own component.

## Running locally

**Backend** (from `backend/`):
```
mvn spring-boot:run
```
Runs on http://localhost:8080. Check http://localhost:8080/api/health.

**Frontend** (from `frontend/`):
```
npm install
npm run dev
```
Runs on http://localhost:5173 and calls the backend's `/api/health` endpoint on load to confirm the two are connected.
