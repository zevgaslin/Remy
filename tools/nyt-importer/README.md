# Offline NYT recipe importer

The requested automated collector is blocked: the agent's browser site-safety policy denied NYT Cooking access. This tool only processes HTML files the user saves independently. It makes no network requests, uses no credentials, and does not automate sign-in.

Uses the JSON-LD extraction approach from https://github.com/BrianVia/nyt-cooking-parser/blob/main/nytRecipeExtractor.ts with graph/section handling and validation. No upstream code is executed or dependencies installed.

Save recipe pages as HTML into `input/` here, then run from this directory:

```sh
node import.mjs ./input ./output 1000
```

Writes `output/nyt-recipes.json` in the upstream parser's general shape and `output/report.json`. This is a staging export, not Remy's version-1 catalog schema, and is not automatically loaded into Supabase. Only complete recipes with NYT recipe URLs, ingredients, and instructions are accepted. Duplicates use the numeric NYT recipe ID. Re-running replaces the export using the current input set. Exit 2 means fewer than the target were available; exit 1 means an error. No recipe content or account data should be committed.

Popularity remains unverified: search results mention NYT collections of 25 or 50 popular recipes, but no official catalog-wide top-1,000 ranking was verified. File order is deterministic and is not a popularity ranking. Rating count, when present, is retained as metadata and is not interpreted as NYT's popularity score.
