# Recipe JSON format — version 1

This defines the file contract for the upcoming importer and Supabase loader. It does not load files or change the current API yet.

- `recipe.schema.json` is the JSON Schema (Draft 2020-12).
- `examples/garlic-butter-pasta.json` illustrates the required beginner-friendly detail, expanding the existing seed recipe with authored cooking guidance. It is documentation, not a second production recipe source.
- Production files will live in `backend/recipes/<id>.json`, one recipe per file, outside the compiled application resources so new files can be added without rebuilding Java code.

## Identity and updates

Generate a UUID once for `id`; keep it across edits and renames. `schemaVersion` is `1`. Reject unsupported versions rather than silently discarding fields. The loader will upsert by this ID using a unique catalog ID column, preserving the existing numeric database ID and user reaction references. Likes, dislikes, user IDs, and pantry data do not belong in recipe files.

JSON is authoritative for recipe content; Supabase is its searchable copy and the store for mutable user data. Index updates must not delete/recreate recipe rows. Duplicate IDs across files are errors. The importer should deduplicate website URLs before assigning new IDs; identical names alone are not proof of duplicates.

## Fields and unknown values

All fields shown in the schema are required keys. Unknown scalar detail is `null`, never fabricated or represented as zero. Empty tag/keyword lists are valid. Names, ingredients, and instructions must contain nonblank text, and ingredient/instruction arrays must be nonempty. Extra keys are rejected to catch misspellings. Future additions require a deliberate schema change.

- Timing uses whole minutes. Preserve unknown total time as null; prep plus cook time may omit resting, chilling, or overlapping work.
- Servings is a positive number when known; `yieldText` preserves values such as "12 cookies" without assuming that each cookie is one serving.
- Ingredient array order follows the source. `section` supports dough, filling, sauce, etc. Repeated ingredients are allowed across steps or sections. `name` is the searchable ingredient name; `originalText` preserves the source line; `preparation` stores details such as "finely chopped".
- `quantity` is a positive parsed number or null. `quantityText` preserves fractions, ranges, or "to taste"; do not collapse a range into an invented number. `unit` preserves the supplied unit; conversion is outside this format task. `optional` is true only when explicitly optional; otherwise false.
- Instructions are ordered objects with `text` and nullable `section`. Their array positions define cooking order. Preserve every instruction and section; do not summarize away temperatures, resting times, or warnings. `source.originalInstructions` can retain original instruction text for comparison.
- Preference tags retain the existing `{name, value}` shape. Use lowercase values for matching, e.g. `{"name":"diet","value":"vegetarian"}`. Do not infer allergy safety or dietary claims solely from an incomplete ingredient list. `keywords` holds additional source keywords.
- `nutrition` is null when unknown, or an object explicitly based on one serving. Calories are kcal; protein, carbs, and fat are grams. Individual unknown values are null. `estimated` distinguishes estimates from supplied values. Do not treat nutrition for a whole recipe as per-serving without a known conversion.
- `imageUrl` is an HTTP(S) source image URL or null; storing a URL does not download the image.

## Instruction quality: a beginner must be able to follow every step

Write instructions for someone who has never cooked the dish. Each array item should cover one clear stage of the process, in execution order. Include preparation, cooking, finishing, and serving; do not assume that the reader knows what "cook pasta" or "saute garlic" means.

- Name the equipment and useful size or capacity where it affects the result.
- Explain preparation actions: peel garlic, chop it into small pieces, grate cheese, and measure ingredients before they are needed. Ingredient preparation labels do not replace these steps.
- Repeat the quantity and unit when an ingredient is used. For divided ingredients, specify how much goes into each stage and what to reserve.
- State stove heat or oven temperature, when to change it, and when to turn it off. Include temperature units for oven settings.
- Give cooking times or ranges and observable completion cues: tender pasta without a hard center, pale fragrant garlic, or a glossy sauce. Explain what to do if the food is not ready or browns too quickly.
- Explain unfamiliar techniques in plain language. "Toss" should describe turning the pasta with tongs or a spoon; "rolling boil" should describe continuous large bubbles.
- Include easy-to-miss transitions such as reserving pasta water before draining, removing the pan from heat before adding cheese, and serving while warm.
- Use package-dependent timing explicitly when appropriate. Different pasta shapes have different cooking times; use the printed range and explain how to check doneness rather than promise one universal minute count.
- Check that every required ingredient is used, optional ingredients are identified, reserved amounts are accounted for, and equipment and actions appear before they are needed.

An acceptable step is: "Add all the chopped garlic to the 2 tablespoons melted butter over medium heat. Stir for 30–60 seconds until fragrant and lightly sizzling; keep it pale or lightly golden, lowering the heat if it darkens quickly." "Saute garlic" alone does not meet the standard.

For website imports, preserve the full original instructions and distinguish any later authored clarification from source text. Do not invent source quantities, temperatures, timings, or missing cooking stages to make an incomplete scrape appear complete. Recipes that need clarification should remain outside the loadable folder until reviewed and expanded. Structural schema validation cannot assess whether a novice could cook the recipe; this quality review is a separate acceptance check.

## Source and import validation

`source.kind` is `website`, `manual`, or `legacy-seed`. Website imports require an HTTP(S) recipe URL and an ISO 8601 import timestamp with timezone. Preserve site name and author when available; otherwise null. Legacy seed recipes must not be attributed to invented websites. Imported timestamps and source attribution are metadata, not cooking instructions.

Use a JSON Schema validator with UUID, URI, and date-time format checks enabled. Schema validation alone cannot establish recipe completeness: the importer must check that extraction retained all available ingredient and instruction sections and refuse to save partial extraction as a successful import. Missing optional metadata is acceptable. Keep parsing failures separate from the loadable recipe folder with actionable diagnostics.

The pasta example contains 11 detailed stages, from equipment and boiling water through serving. Its ingredient amounts come from the legacy seed, and its expanded method is authored guidance rather than text extracted from a website. `source.originalInstructions` retains the original three sentences for comparison. Timing is approximate and pasta cooking time follows the package plus a doneness check. Water used for boiling and sauce is specified in the method. Existing nutrition values remain legacy estimates, not newly verified calculations.

## Compatibility work for later tasks

The current API exposes instructions as a string and nutrition without basis/estimate metadata. The loader/API adapter must preserve existing consumers while the richer UI is developed. The existing database ingredient uniqueness constraint must change to support repeated ingredients, sections, and ordering. Add stable catalog identity and ordered steps as part of the loader migration, with migration coverage for user reactions.

Next task: create the production recipe folder and convert the existing recipes. No conversion or database writes are part of this task.
