# Recipe system review — Task 1

Reviewed October 16, 2026. Scope: inspect the active `Remy` project, excluding `Remy Joshs' commit backup`. This is a source-code review; no application behavior was changed and no live database was queried or modified.

## Current storage and loading

- Backend: Java 17, Spring Boot, Spring Data JPA/Hibernate, and a persistent H2 SQL database (`backend/pom.xml`, `backend/src/main/resources/application.properties`). The configured database location is `./data/remy`, relative to the backend process working directory.
- Hibernate updates the schema at startup. `backend/src/main/resources/data.sql` runs after schema initialization on every startup and guards seed inserts against duplicates.
- That seed file defines 13 sample recipes, their ingredients and preference tags, and estimated nutrition per serving. Actual database contents may include additional recipes created through the API.
- Recipes are not backend string variables. Sample content is embedded in SQL; application-created recipes are database records. No JSON recipe directory or file loader exists in this path.
- `DataBase/Recipies.sql` and `DataBase/remy_schema.sql` contain separate MySQL-style definitions. The running backend is configured for H2 and its resource `data.sql`, rather than these standalone scripts. They are not identical schemas.

## Existing recipe detail

`backend/src/main/java/com/remy/backend/model/Recipe.java` contains:

| Area | Existing fields |
| --- | --- |
| Identity | Generated numeric ID, name |
| Description | Description, cuisine, meal type, difficulty |
| Timing and yield | Prep minutes, cook minutes, servings |
| Method | Instructions as a single text string |
| Ingredients | Name, numeric quantity, unit, optional flag; separate related records |
| Preferences | Name/value tags; separate related records |
| Nutrition | Calories, protein, carbs, fat per serving |
| Reactions | Aggregate likes/dislikes; separate per-user reaction records |

Missing for the planned import flow: source URL/site/author, image URL, import timestamps, stable file identity, schema version, ordered structured steps, ingredient preparation notes and original ingredient text. The ingredient table currently allows only one entry per ingredient name per recipe; repeated ingredients in different recipe sections will need consideration.

Although the model contains detailed fields, create and update endpoints accept only `name` and `instructions`. They cannot currently populate the other fields through the recipe API.

## API and search

Primary entry point: `backend/src/main/java/com/remy/backend/controller/RecipeController.java`.

| Route | Current behavior |
| --- | --- |
| `GET /api/recipes` | All recipes, descending ID |
| `GET /api/recipes/feed` | Loads all recipes, excludes the signed-in user's reviewed recipes, then applies offset/limit in Java |
| `POST /api/recipes/search` | Ingredient and preference matching, with optional requirement that all required ingredients are available |
| `GET /api/recipes/matches` | Matching using the signed-in user's pantry and saved preferences |
| `POST /api/recipes`, `PUT /api/recipes/{id}` | Create/update name and instruction text |
| `DELETE /api/recipes/{id}` | Delete a recipe |
| Reaction and preference routes | Save likes/dislikes and user dietary preferences |

`RecipeRepository` fetches recipes and their ingredient/tag relationships from SQL. `RecipeMatchingService.search` then filters, scores, sorts, and limits the full collection in Java. Search predicates are not currently executed in SQL.

Matching normalizes ingredient names using `IngredientNameNormalizer`, requires all requested preference tags, and ranks by the fraction of required ingredient names available. It does not check quantities or convert units.

**Confirmed contract mismatch:** `frontend/src/services/recipeServices.js` sends a `query` field from `RecipesPanel`, but `RecipeSearchRequest` has no query field and `RecipeMatchingService` never uses keyword text. Keyword filtering is therefore unimplemented in the backend. The frontend service test checks that the field is sent, rather than proving that backend results match it.

No recipe website discovery or import flow exists in the inspected recipe path.

## Frontend display and dependencies

- `frontend/src/components/RecipesPanel.jsx` loads the feed or full list and submits ingredient, diet, and keyword search values. Search responses contain recipe/match wrappers, which the panel flattens for display.
- `frontend/src/components/recipes.jsx` shows a recipe name, match score, matched/missing ingredients, and reaction buttons.
- `frontend/src/components/RecipeHoverPopover.jsx` displays only the name and instruction string. The detailed model fields are largely absent from recipe previews.
- `frontend/src/components/CalendarPanel.jsx` fetches all recipes for its picker, stores selected recipe objects in component state, and totals their nutrition. It also contains hardcoded demonstration meals. Changes to nutrition shape or instruction format must account for this consumer.
- `RecipePreference` refers to a recipe entity through a database foreign key. `RecipePreferenceService` updates both user reactions and aggregate counters. Rebuilding the recipe index with new IDs could break or detach existing reactions.

## Implications for Tasks 2–6

1. **Task 2: define the JSON contract.** Preserve useful existing fields, add provenance and structured detail, and define stable identity plus schema version. Decide how ordered ingredient sections and steps work, how unknown quantities/nutrition are represented, and how old API responses remain compatible.
2. **Task 3: migrate content and implement loading.** Export existing database recipes as well as convert the 13 seeds. Add folder discovery, validation, duplicate detection, and clear handling of changed/deleted/invalid files. Replace only recipe seed statements; `data.sql` also seeds non-recipe data. Define how existing create/update/delete endpoints write JSON files.
3. **Task 4: implement the SQL index and keyword search.** Treat JSON as authoritative recipe content and the SQL recipe data as a derived searchable index. Preserve stable recipe references and mutable user data. Move candidate filtering/pagination into SQL while retaining pantry scoring behavior where appropriate. Connect the currently unused keyword query.
4. **Task 5: import from a URL.** Normalize imported content into the same JSON contract, retain provenance, and deduplicate before saving. Import must use the same validation/loading path as manually added files.
5. **Task 6: discovery and display.** Add keyword-based page discovery, import selection, and a detailed recipe view; update recipe cards, previews, and calendar consumers together.

The earlier outline proposed SQLite. The existing application already uses H2 for users, pantry data, preferences, and recipes. A JSON-derived SQL index can use the existing H2 database; SQLite would introduce another database or require a larger migration. Select the engine during Task 4 design rather than making it a prerequisite for the file format.

## Verification available for implementation work

- `backend/src/test/java/com/remy/backend/SeedDataIntegrationTest.java`: seeded recipes, ingredients, preference tags, and nutrition.
- `backend/src/test/java/com/remy/backend/controller/CrudApiControllerTest.java`: recipe CRUD, reactions, feed exclusion, and pantry/preference search.
- `backend/src/test/java/com/remy/backend/service/IngredientNameNormalizerTest.java`: ingredient normalization.
- Frontend `RecipesPanel.test.jsx`, `recipeServices.test.jsx`, and `CalendarPanel.test.jsx`: relevant UI and service coverage.
- Backend uses Maven tests; frontend uses Vitest. These tests were inspected, not run for this documentation-only task.

Future migration checks should verify that adding a valid JSON file makes it searchable without Java edits, keyword queries filter results, richer details survive import/loading, invalid files produce actionable diagnostics, and rebuilding the index preserves user reactions and pantry behavior.
