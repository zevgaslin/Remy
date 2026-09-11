# Remy
Software Studio Project

A website that recommends what to cook for the week based on the ingredients you have on hand and their expiration dates. See [docs/requirements.md](docs/requirements.md) for personas, user stories, and MVP scope.

## Structure

- `backend/` — Spring Boot (Java) API. Entry point: `src/main/java/com/remy/backend/RemyApplication.java`. Controllers in `controller/`, JPA entities in `model/`, data access in `repository/`, request/response shapes in `dto/`.
- `frontend/` — React (Vite) app. Entry point: `src/App.jsx`, which renders the dashboard at `src/pages/homePage.jsx`.
- `DataBase/remy_schema.sql` — reference schema only; not wired into the app. The actual schema comes from the JPA entities via Hibernate.

## What's built so far

- **Dashboard homepage**: a meal-planning calendar (This Week / Next 7 Days / Month views, with a scalable set of meal slots — add or remove beyond the default Breakfast/Lunch/Dinner/Snack), an "Expiring Soon" ingredients panel, and a recipes panel.
- **Accounts**: register/login (`POST /api/auth/register`, `POST /api/auth/login`), passwords hashed with BCrypt, a session token issued on login.
- **Ingredients**: each logged-in user has their own pantry list (`/api/ingredients`, scoped by owner) — add an ingredient with a name/quantity/unit/expiration date, and the "Expiring Soon" panel sorts by urgency.
- **Recipes**: shared recipe list (`/api/recipes`) with favorite/dislike, and a hover preview that shows the full recipe on both recipe cards and calendar meal chips.

Not built yet: assigning a recipe to a specific meal slot on the calendar, per-user recipe favorites persisting server-side, and staying logged in across a page refresh (auth currently lives in memory only, not a cookie/localStorage).

## Running locally

**Backend** (from `backend/`):
```
./mvnw spring-boot:run
```
Runs on http://localhost:8080. Check http://localhost:8080/api/health. Data is stored in a file-based H2 database under `backend/data/` (gitignored) — it persists across restarts, and `data.sql` seeds a couple of sample recipes/ingredients the first time.

**Frontend** (from `frontend/`):
```
npm install
npm run dev
```
Runs on http://localhost:5173 and talks to the backend over `http://localhost:8080/api/*`.

Run both at once, in two terminals, to use the app.

