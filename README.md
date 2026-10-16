# Remy

[![Backend CI](https://github.com/zevgaslin/Remy/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/zevgaslin/Remy/actions/workflows/backend-ci.yml)

Software Studio Project

A website that recommends what to cook for the week based on the ingredients you have on hand and their expiration dates. See [docs/requirements.md](docs/requirements.md) for personas, user stories, and MVP scope.

## Structure

- `backend/` — Spring Boot (Java) API. Entry point: `src/main/java/com/remy/backend/RemyApplication.java`. Controllers in `controller/`, JPA entities in `model/`, data access in `repository/`, request/response shapes in `dto/`.
- `frontend/` — React (Vite) app. Entry point: `src/App.jsx`, which renders the dashboard at `src/pages/homePage.jsx`.
- `DataBase/remy_schema.sql` — reference schema only; not wired into the app. The actual schema comes from the JPA entities via Hibernate.
- `docs/architecture/` — design docs and generated class diagram assets.

## Architecture

- Class diagram (editable): [docs/architecture/Remy-Class-Diagram.drawio](docs/architecture/Remy-Class-Diagram.drawio)
- Class diagram (PNG): [docs/architecture/Remy-Class-Diagram.png](docs/architecture/Remy-Class-Diagram.png)

## What's built so far

- **Dashboard homepage**: a meal-planning calendar (This Week / Next 7 Days / Month views, with a scalable set of meal slots — add or remove beyond the default Breakfast/Lunch/Dinner/Snack), an "Ingredients" panel (sorted by soonest expiration), and a recipes panel.
- **Accounts**: register/login (`POST /api/auth/register`, `POST /api/auth/login`), passwords hashed with BCrypt, a session token issued on login.
- **Ingredients**: each logged-in user has their own pantry list (`/api/ingredients`, scoped by owner) — add an ingredient with a name/quantity/unit/expiration date, and the "Ingredients" panel lists them with the soonest-expiring first. Ingredients can optionally store calories, protein, carbs, and fat per unit; the panel shows each item's calories (hover for macros) and a total for the whole pantry.
- **Recipes**: shared recipe list (`/api/recipes`) with favorite/dislike, and a hover preview that shows the full recipe on both recipe cards and calendar meal chips.
- **Recipe matching**: recipes carry ingredient requirements and preference tags. `GET /api/recipes/matches` ranks recipes against the logged-in user's pantry and saved preferences, while `POST /api/recipes/search` accepts keyword, ingredient, and preference values directly. PostgreSQL performs filtering, pantry ranking, and limiting before results are returned. Recipe cards expand to show full JSON ingredients and ordered steps.

## Recipe matching API

Preference names and values match the tags in `DataBase/Recipies.sql`, including `diet=vegetarian`, `diet=high-protein`, `meal_type=breakfast`, `cuisine=italian`, and `difficulty=easy`. Matching ignores capitalization and surrounding spaces.

Save all preferences for the logged-in user with `PUT /api/recipes/preferences`:

```json
[
  { "name": "diet", "value": "vegetarian" },
  { "name": "meal_type", "value": "breakfast" }
]
```

Search directly with `POST /api/recipes/search`:

```json
{
  "query": "breakfast wrap",
  "ingredients": ["spinach", "egg", "tortilla", "cheddar"],
  "preferences": [
    { "name": "diet", "value": "vegetarian" },
    { "name": "meal_type", "value": "breakfast" }
  ],
  "requireAllIngredients": false,
  "limit": 20
}
```

Each result contains the recipe, a `matchScore`, the matched pantry ingredients, and the missing required ingredients. Setting `requireAllIngredients` to `true` removes recipes that need anything not supplied in the search.

The calendar recipe picker loads recipes from the backend; selected meals currently live in component state. Recipe reactions are stored per user in Supabase and reviewed recipes are excluded from that user’s feed.

## Running locally

**Backend** (from `backend/`):
```
./mvnw spring-boot:run
```
Runs on http://localhost:8080. Check http://localhost:8080/api/health. All application data is stored in Supabase PostgreSQL. Connection settings are in `backend/src/main/resources/application.yml`; set `SUPABASE_DATABASE_URL`, `SUPABASE_DATABASE_USERNAME`, and `SUPABASE_DATABASE_PASSWORD` to override them. Keep credentials in environment variables or the gitignored `application-secrets.properties`. Legacy `data.sql` initialization is disabled. Existing H2 files are not used or automatically migrated.

**Frontend** (from `frontend/`):
```
npm install
npm run dev
```
Runs on http://localhost:5173 and talks to the backend over `http://localhost:8080/api/*`.

Run both at once, in two terminals, to use the app.


## Recipe catalog and search

Run `./scripts/import-recipes.sh` from `backend/` after adding or updating files in `backend/recipes/`. The full documents are stored as JSONB and compatibility fields support the existing API. See [catalog instructions](backend/recipes/README.md).

Keyword search matches every whitespace-separated word, case-insensitively, across recipe names, descriptions, cuisines, meal types, difficulty, ingredient names, preference values, and JSON keywords. It treats punctuation and SQL wildcard characters literally. Dietary filters combine with keyword filters. Ingredient filters use exact normalized names and known aliases, not quantity/unit availability. “Can make right now” requires all nonoptional ingredient names. Empty searches list recipes up to the requested limit (maximum 100).

`RecipesPanel` and the `CalendarPanel` recipe picker use the custom `useRecipes` hook (`frontend/src/hooks/useRecipes.js`) for backend loading, search, pantry filters, loading/error state, and saved reactions. The components own their form and presentation; recipe content lives in Supabase. The calendar uses catalog mode to list all recipes; signed-in recipe panels use the personalized feed.

Frontend requests go to Spring Boot, which queries Supabase using server-side credentials. No database password or Supabase service key belongs in frontend code. `GET /api/recipes/{id}` returns full recipe details; feed pagination and reviewed-recipe exclusion run in SQL.

Instructions use the plain PostgreSQL `instruction_text` column. At startup, `RecipeTextMigration` copies missing values from the old `instructions` column, including PostgreSQL large objects, while retaining the original data. This avoids per-recipe large-object reads when loading the calendar picker. Recipe-list requests time out after 15 seconds, and the picker shows errors with a retry button.

Edits through the existing recipe API update both compatibility text and the stored JSON when present. Local JSON files remain the catalog source of truth: the next import overwrites those database content edits. Recipe deletion also removes its user reaction records so foreign keys remain valid. The next import can restore a deleted file-backed recipe.

## Verification

From `backend/`, run `./mvnw verify`. Integration tests use temporary, isolated PostgreSQL instances via an embedded test runtime; they do not connect to Supabase or require Docker. The first run downloads the test binaries. H2 is not a test dependency.

From `frontend/`, use Node 22.12+ (or Node 20.19+) and run `npm test` and `npm run build`.
