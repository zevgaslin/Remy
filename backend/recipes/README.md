# Prepared recipe catalog

The 13 JSON files at this folder's root rewrite the existing sample recipes using the [version 1 format](../../docs/recipes/README.md). The `web-import-2026-10-16/` subfolder contains 100 additional website-sourced recipes; see the [source catalog](../../docs/recipes/website-batch-2026-10-16.md). Run the loader explicitly after adding or changing files; files are not watched automatically.

## Importing into Supabase

From `backend`, run:

```bash
./scripts/import-recipes.sh
# Or select a different folder:
./scripts/import-recipes.sh /absolute/path/to/recipes
```

The command uses the backend's configured database credentials, starts without an HTTP server, recursively validates every JSON file (including subfolders) against the bundled schema, and imports the folder in one transaction. It prints created, updated, and unchanged counts after commit, then verifies the stored documents in a separate read transaction. A failure exits nonzero. The import does not run during ordinary app startup, and deleting a local file does not delete a database recipe.

The `recipe` table stores the full file in its JSONB `document` column, with a unique `catalog_id` for repeatable updates. Existing API columns, ingredients, and preference tags are populated for compatibility. The API still returns numbered instruction text; the full structured content is available in `document`. Reimporting identical content makes no writes. An unambiguous existing recipe with the same name and no catalog ID is adopted, preserving its numeric ID and reactions; ambiguous matches fail rather than selecting arbitrarily. Likes/dislikes are never imported from files.

The old compatibility ingredient table supports one entry per ingredient name. For repeated names, the full ordered entries stay in JSONB while matching uses one name with unknown quantity/unit and considers it required if any occurrence is required. Fractional servings and nutrition remain exact in JSONB; legacy integer API fields are null when a value cannot be represented exactly.

The runtime schema is `src/main/resources/recipe.schema.json`; the documentation copy must remain identical. The focused checks run with `./mvnw -Dtest=RecipeCatalogServiceTest test`. The full integration suite now uses isolated PostgreSQL schemas and the JSON catalog; it does not connect to Supabase.

The 13 legacy files described below retain the original ingredient quantities, optional flags, preference tags, estimated nutrition, and original instruction text. Expanded instructions are authored guidance, not recipes scraped from or tested by a cooking website. No website attribution has been invented. These methods have not been kitchen-tested.

The expanded methods specify preparation, equipment, heat, cooking ranges, completion checks, and serving. They clarify previously ambiguous choices such as dry long-grain white rice, rolled oats, canned-bean size, and boneless chicken. Water is specified directly in steps. The chicken method uses only its listed ingredients, rather than adding the black pepper mentioned in the old text but absent from its ingredient list. Methods that have no cooking oil listed use a nonstick pan and water instead of introducing an unlisted fat.

Prep, cook, and total minutes are null pending measurement: the old estimates do not reliably describe the expanded methods, especially marinating, cooking rice, and baking in batches. Individual steps still contain practical time ranges and completion checks. Nutrition remains an unverified legacy estimate. Dietary tags are inherited classifications; for example, the chili's dairy-free variation requires omitting optional cheddar, and cheese selection can affect vegetarian suitability.

Food thermometer endpoints follow the [USDA temperature chart](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart): chicken 165°F (74°C), ground beef and egg dishes 160°F (71°C), and fish 145°F (63°C). These references support cooking endpoints, not the recipes' taste or nutrition estimates.

| Recipe | JSON file |
| --- | --- |
| Banana Peanut Butter Oats | [8449abfd-5799-5198-9002-1cc1d9e654ae.json](8449abfd-5799-5198-9002-1cc1d9e654ae.json) |
| Black Bean Sweet Potato Tacos | [b32f6e89-e627-596f-bb19-335bd401ba7c.json](b32f6e89-e627-596f-bb19-335bd401ba7c.json) |
| Broccoli Cheddar Rice Skillet | [6b3113dd-e60c-5d84-898c-c27318db2a3d.json](6b3113dd-e60c-5d84-898c-c27318db2a3d.json) |
| Chocolate Chunk Cookies | [dca3bc09-803c-5d2b-845c-6937df040ea8.json](dca3bc09-803c-5d2b-845c-6937df040ea8.json) |
| Classic Beef Chili | [f5e9e054-6ee3-5cc4-a38c-400e0ba1528e.json](f5e9e054-6ee3-5cc4-a38c-400e0ba1528e.json) |
| Classic Pancakes | [f81fe1ef-791e-5a54-adea-d38f598ad419.json](f81fe1ef-791e-5a54-adea-d38f598ad419.json) |
| Easy Mac and Cheese | [5cece44a-3292-5df3-90e0-0bdb8e927ce6.json](5cece44a-3292-5df3-90e0-0bdb8e927ce6.json) |
| Garlic Butter Pasta | [6b4da39a-68bc-4e50-a8ae-bf28b5a4d479.json](6b4da39a-68bc-4e50-a8ae-bf28b5a4d479.json) |
| Homemade Chicken Noodle Soup | [c9f43121-de9d-526d-99c1-1ba856fd91ce.json](c9f43121-de9d-526d-99c1-1ba856fd91ce.json) |
| Lemon Yogurt Chicken | [66508622-6765-5d2f-854f-8047c786a681.json](66508622-6765-5d2f-854f-8047c786a681.json) |
| Salmon Quinoa Bowl | [8e3d82cf-cf17-5bec-a965-9c31b9699c13.json](8e3d82cf-cf17-5bec-a965-9c31b9699c13.json) |
| Spinach Egg Breakfast Wrap | [479f40bd-a3c7-59a5-be25-3f0f38d84033.json](479f40bd-a3c7-59a5-be25-3f0f38d84033.json) |
| Veggie Stir Fry Rice Bowl | [c62c0d7a-f232-52be-b354-e8025aca36f9.json](c62c0d7a-f232-52be-b354-e8025aca36f9.json) |
