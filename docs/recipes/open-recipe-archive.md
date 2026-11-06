# Open Recipe Archive import

The automated importer stages exactly 1,000 unique historical recipes from [Open Recipe Archive](https://github.com/AdamBouhmad/open-recipe-archive), then uses Remy's existing transactional catalog loader to import them into the configured database and read back every stored document. No account, API key, page saving, or source code execution is needed.

Run from the repository root:

```bash
./backend/scripts/import-open-recipe-archive.sh
```

The wrapper creates a Python environment under ignored `backend/data/`, installs the pinned JSON Schema validator, downloads two JSONL data files, prepares the files, and invokes the existing Java loader. It needs Python 3, the backend's Java/Maven prerequisites, network access and Remy's configured database credentials. The configured database is modified immediately when this command runs.

The source revision is pinned to `ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8`. Data comes from `ye-old-american` and `canadian-kitchen`; the input bytes, selected recipe links, source revision, and rejected-entry counts are recorded in [the report](open-recipe-archive-report.json). Raw data and Python dependencies are cached outside the committed catalog. The report is deliberately outside the recipe folder because the catalog loader validates every JSON file beneath its input directory.

## Selection and provenance

Selection is deterministic by hashed archive identity. Duplicate normalized titles and identical bodies are excluded within this batch. IDs are UUIDs derived from the archive collection and recipe slug, independent of the pinned revision. Re-running preserves the initial import timestamps and existing database IDs and user reactions; unchanged documents make no writes. Existing recipes with their own different catalog IDs are retained, even if their names match an archive recipe. No existing catalog files are deleted or replaced.

Only records explicitly labeled `public-domain` are accepted. Each saved document retains its archive recipe link, original cookbook URL/title/year, source author when supplied, license, original ingredient lines, and complete archive directions. The public-domain designation is the archive's source metadata, not an independent legal assessment of every cookbook.

Unexpected Markdown sections or unparsed lines, missing fields, very short methods, mostly unspecified quantities, dependent recipe references, and selected hazardous historical ingredients/preservation methods are rejected. The script fails before staging recipes if it cannot find the full target. Every document is validated against Remy's JSON Schema with URI, UUID, and timestamp checks. No omitted directions, quantities, cooking stages, nutrient values, or images are generated to fill gaps.

These are historical source recipes, not individually reviewed beginner adaptations. The earlier catalog documentation's beginner-review standard is not claimed for this batch. Source descriptions explicitly identify their historical status. Automated filtering is not a guarantee of modern cooking suitability. Nutrition, servings, cook/prep times, and images remain null because the archive does not provide reliable structured values for them. Numeric ingredients are parsed conservatively; ambiguous lines retain the exact original text. This batch is suitable as an attributed historical catalog, not a source of measured nutrition for Remy's journal.

## Validation

```bash
backend/data/open-recipe-archive/venv/bin/python -B -m unittest discover -s backend/scripts -p test_import_open_recipe_archive.py
cd backend
./mvnw -Dtest=RecipeCatalogServiceTest test
```

The loader prints `RECIPE IMPORT COMMITTED` after transaction commit and `RECIPE READ-BACK VERIFIED: 1000` only after a separate read transaction compares all 1,000 stored documents. A failed import exits nonzero; read-back failure after commit must not be mistaken for a rollback. Refresh the app's recipe list after import to bypass its short catalog cache.
