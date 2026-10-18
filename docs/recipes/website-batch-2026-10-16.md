# Website recipe batch — October 16, 2026

This batch contains **100 additional recipes**, each in its own JSON file under `backend/recipes/web-import-2026-10-16/`. All source URLs were fetched successfully from [Public Domain Recipes](https://publicdomainrecipes.com/), a community cooking collection whose [published license](https://github.com/ronaldl29/public-domain-recipes#license) dedicates its content to the public domain. These are not NYT recipes or professionally verified recipes.

The batch was selected from 191 inspected candidate pages. Rejected examples included missing main ingredients, unusable quantities, conflicting measurements, and methods unsuitable for this batch. Every file retains the real source URL, available contributor attribution, import timestamp, original ingredient lines, original directions, reuse terms, and a description of Remy's adaptations. `website-batch-2026-10-16.sources.json` records the selected URLs, reviewed rewrites, stable IDs, and SHA-256 hashes of the retrieved HTML snapshots.

The active instructions are **adapted**, not presented as verbatim source directions. They preserve the source method while adding preparation explanations, technique definitions, completion checks, and explicit beginner steps where the source was terse. One source's 140°F meatball endpoint was corrected to 160°F; its unmodified text remains only in provenance. See [USDA cooking temperatures](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart) and [food storage guidance](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/steps-keep-food-safe). Adaptations have not been kitchen-tested.

Unknown nutrition, quantities, timings, and exact yields are left null or preserved as source ranges. No calories or macros were invented. Examples of unspecified details include salt to taste, greasing oil, or a can whose size is not given. Dietary claims are included only when explicitly tagged by the source; general category tags do not imply allergy safety.

## Verified Supabase upload

Uploaded on October 16, 2026: **100 created, 0 updated**, with all 100 documents verified after commit. A separate read through the running backend confirmed that every stored document exactly matches its local JSON file and that all 13 existing recipes are unchanged, for **113 recipes total**. Keyword searches for banana bread, chicken tikka masala, naan, and salsa returned the new content.

Validation passed: 61 backend tests, 72 frontend tests, the frontend production build, and 6 Python preparer tests. The final regenerated batch also passed its PostgreSQL import/read-back/reimport integration test.

## Reproducing and importing

From the repository root, install `backend/scripts/recipe-import-requirements.txt` in a Python environment, then prepare the reviewed batch:

```bash
python3 backend/scripts/prepare_public_domain_batch.py \
  --sources docs/recipes/website-batch-2026-10-16.sources.json \
  --output backend/recipes/web-import-2026-10-16
```

The preparer accepts only the reviewed public-domain source, reads the supplied URL manifest rather than guessing URLs, validates all documents before writing, and keeps stable IDs and existing import timestamps on reruns. Only HTML is downloaded; images remain source URL references. Original snapshots are cached outside the repository by default.

From `backend/`, upload only this batch:

```bash
./scripts/import-recipes.sh recipes/web-import-2026-10-16
```

The default `./scripts/import-recipes.sh` now recursively loads the full catalog, including subfolders. Existing recipes and user reactions are preserved by stable-ID upserts. Missing files are not deleted from Supabase. Integration tests use separate copies of the original 13 fixtures so adding catalog content does not change established test expectations.

## Recipe index

| Recipe | Local JSON | Source |
| --- | --- | --- |
| Banana Bread | [JSON](../../backend/recipes/web-import-2026-10-16/e6adcdbd-4f4e-584c-859e-90993a38118f.json) | [Recipe](https://publicdomainrecipes.com/banana-bread/) |
| Banana Pancakes | [JSON](../../backend/recipes/web-import-2026-10-16/9c32811b-f6e2-5fd1-af28-b1a51791bdd9.json) | [Recipe](https://publicdomainrecipes.com/banana-pancakes/) |
| Banana and oatmeal cookies | [JSON](../../backend/recipes/web-import-2026-10-16/7df04a8d-65a9-5efe-9a07-90122cace14f.json) | [Recipe](https://publicdomainrecipes.com/banana-oatmeal-cookies/) |
| Basic Meatballs | [JSON](../../backend/recipes/web-import-2026-10-16/01e947c7-b120-572f-bbbd-0433176dd65e.json) | [Recipe](https://publicdomainrecipes.com/basic-meatballs/) |
| Basic Waffles | [JSON](../../backend/recipes/web-import-2026-10-16/2c8e02ee-e1e5-5bd2-903c-ea8ecb76e84a.json) | [Recipe](https://publicdomainrecipes.com/basic-waffles/) |
| Blueberry Muffins | [JSON](../../backend/recipes/web-import-2026-10-16/d36c3de6-3bca-54fe-821a-ac71100482ae.json) | [Recipe](https://publicdomainrecipes.com/blueberry-muffins/) |
| Bolognese Sauce | [JSON](../../backend/recipes/web-import-2026-10-16/5307a27d-b507-5caa-b5a1-7af3ef5f71ca.json) | [Recipe](https://publicdomainrecipes.com/bolognese-sauce/) |
| Bread | [JSON](../../backend/recipes/web-import-2026-10-16/87cac5e3-353b-5f81-9fce-a8cb085f3735.json) | [Recipe](https://publicdomainrecipes.com/bread/) |
| Brown Butter Cinnamon Sugar Biscuits | [JSON](../../backend/recipes/web-import-2026-10-16/64c7f7d4-6ef0-5ca2-a0c8-f8fbb568d978.json) | [Recipe](https://publicdomainrecipes.com/cinnamon-biscuits/) |
| Butter Cake | [JSON](../../backend/recipes/web-import-2026-10-16/2719d556-4a37-586f-afcf-59536229f2f2.json) | [Recipe](https://publicdomainrecipes.com/butter-cake/) |
| Challah Bread | [JSON](../../backend/recipes/web-import-2026-10-16/6a47c7d0-fb14-5c99-a71a-2f73ee0394cb.json) | [Recipe](https://publicdomainrecipes.com/challah-bread/) |
| Cheddar-Crusted Chicken | [JSON](../../backend/recipes/web-import-2026-10-16/ea3915a8-ab36-5fe5-9818-568fbc451a21.json) | [Recipe](https://publicdomainrecipes.com/cheddar-crusted-chicken/) |
| Cheesy Potato Bake | [JSON](../../backend/recipes/web-import-2026-10-16/26b3e42b-4c94-5fd1-af1a-5b27699c0596.json) | [Recipe](https://publicdomainrecipes.com/cheesy-potatoe-bake/) |
| Chicken Biscuit Potpie Recipe | [JSON](../../backend/recipes/web-import-2026-10-16/0b2485a6-7aa9-5fb8-8777-642551f99cc7.json) | [Recipe](https://publicdomainrecipes.com/chicken-biscuit-potpie/) |
| Chicken Paprikash | [JSON](../../backend/recipes/web-import-2026-10-16/b3610664-e4dd-5072-bb10-75d12d78aa07.json) | [Recipe](https://publicdomainrecipes.com/chicken-paprikash/) |
| Chicken Pasta Casserole | [JSON](../../backend/recipes/web-import-2026-10-16/25960806-0e1c-5e03-8192-fa856d1fcbde.json) | [Recipe](https://publicdomainrecipes.com/chicken-pasta-casserole/) |
| Chicken Satay with Peanut Sauce | [JSON](../../backend/recipes/web-import-2026-10-16/4ea29d5f-2f51-5295-9b60-4c3dc6b3a500.json) | [Recipe](https://publicdomainrecipes.com/chicken-satay/) |
| Chicken Soup | [JSON](../../backend/recipes/web-import-2026-10-16/a2ce995c-7a69-53b3-8b9b-fec71b6d7e8a.json) | [Recipe](https://publicdomainrecipes.com/chicken-soup/) |
| Chicken Tikka Masala | [JSON](../../backend/recipes/web-import-2026-10-16/aadfbc6b-06c0-5411-a579-245dfa602104.json) | [Recipe](https://publicdomainrecipes.com/chicken-tikka-masala/) |
| Chocolate Chip Cookies | [JSON](../../backend/recipes/web-import-2026-10-16/508d8272-7c4a-5d40-8cbe-7f99db537a1d.json) | [Recipe](https://publicdomainrecipes.com/chocolate-chip-cookies/) |
| Coleslaw | [JSON](../../backend/recipes/web-import-2026-10-16/4c1faf08-c899-56b1-98cc-1b7473e48015.json) | [Recipe](https://publicdomainrecipes.com/coleslaw/) |
| Crème brûlée | [JSON](../../backend/recipes/web-import-2026-10-16/95bfedcd-d93c-5441-87e5-d8288b82776e.json) | [Recipe](https://publicdomainrecipes.com/creme-brulee/) |
| Easy Chicken and Rice Casserole | [JSON](../../backend/recipes/web-import-2026-10-16/fc746ec7-169e-531e-bc3f-ba6b97a472ba.json) | [Recipe](https://publicdomainrecipes.com/easy-chicken-and-rice-casserole/) |
| Egg Roll in a Bowl | [JSON](../../backend/recipes/web-import-2026-10-16/20de8eb1-867e-5d90-826c-97a3516d3046.json) | [Recipe](https://publicdomainrecipes.com/eggroll-in-a-bowl/) |
| Fajitas | [JSON](../../backend/recipes/web-import-2026-10-16/4d29a2c9-9b95-5ddf-b696-28264d76870c.json) | [Recipe](https://publicdomainrecipes.com/fajitas/) |
| Fall Vegetable and Chickpea Curry | [JSON](../../backend/recipes/web-import-2026-10-16/97ed41f8-0f13-5bc4-87a9-efe13d05ffb4.json) | [Recipe](https://publicdomainrecipes.com/fall-vegetable-and-chickpea-curry/) |
| Fennel White Bean and Kale Soup | [JSON](../../backend/recipes/web-import-2026-10-16/80c1dcc3-e300-54f6-9904-dc8eea4ee605.json) | [Recipe](https://publicdomainrecipes.com/fennel-beans-and-kale-soup/) |
| Finnish Salmon Soup | [JSON](../../backend/recipes/web-import-2026-10-16/35f8e9b7-01b2-5f17-b18f-70f1698a0058.json) | [Recipe](https://publicdomainrecipes.com/finnish-salmon-soup/) |
| Fish Curry | [JSON](../../backend/recipes/web-import-2026-10-16/9ca336aa-7d24-5ebd-8a35-0db28e5c2195.json) | [Recipe](https://publicdomainrecipes.com/fish-curry/) |
| Fondue | [JSON](../../backend/recipes/web-import-2026-10-16/0537a14f-c223-5f20-88e0-4078c6cf6c9b.json) | [Recipe](https://publicdomainrecipes.com/fondue/) |
| French Crêpes | [JSON](../../backend/recipes/web-import-2026-10-16/157c4c60-8534-500a-b383-f713fbed1845.json) | [Recipe](https://publicdomainrecipes.com/french-crepes/) |
| French Onion Soup | [JSON](../../backend/recipes/web-import-2026-10-16/a6d2c7c4-a6f5-5daa-a9cb-d316e57cf20d.json) | [Recipe](https://publicdomainrecipes.com/french-onion-soup/) |
| French Toast | [JSON](../../backend/recipes/web-import-2026-10-16/4d09909e-6780-5255-bf33-ee9fc243a7ff.json) | [Recipe](https://publicdomainrecipes.com/french-toast/) |
| Fresh Guacamole | [JSON](../../backend/recipes/web-import-2026-10-16/b71d1dc5-462b-57e1-93f7-ca2e47610ed6.json) | [Recipe](https://publicdomainrecipes.com/guacamole/) |
| Frittata | [JSON](../../backend/recipes/web-import-2026-10-16/2f89924c-3fcc-5062-9420-d8a180c2c77a.json) | [Recipe](https://publicdomainrecipes.com/frittata/) |
| Granola | [JSON](../../backend/recipes/web-import-2026-10-16/abc05877-8d7a-5f23-a114-75149e514ab0.json) | [Recipe](https://publicdomainrecipes.com/granola/) |
| Greek Salad | [JSON](../../backend/recipes/web-import-2026-10-16/e3fa2239-27df-55cc-80e8-00db5205d99f.json) | [Recipe](https://publicdomainrecipes.com/greek-salad/) |
| Hoisin Tofu and Broccoli | [JSON](../../backend/recipes/web-import-2026-10-16/dfda0e11-091b-50d6-9f11-e5357da8abda.json) | [Recipe](https://publicdomainrecipes.com/hoisin-tofu-and-broccoli/) |
| Honey Garlic Chicken with Broccoli and Brown Rice | [JSON](../../backend/recipes/web-import-2026-10-16/f15d8b6c-f1ea-58a0-9432-fc1f9790194b.json) | [Recipe](https://publicdomainrecipes.com/honey-garlic-chicken/) |
| Honey Sriracha Chicken Thighs | [JSON](../../backend/recipes/web-import-2026-10-16/405af776-d08d-5b6b-a012-48c7c8be979b.json) | [Recipe](https://publicdomainrecipes.com/honey-sriracha-chicken-thighs/) |
| Italian Bread | [JSON](../../backend/recipes/web-import-2026-10-16/6011d493-88b6-566c-9ad2-041a557d331f.json) | [Recipe](https://publicdomainrecipes.com/italian-bread/) |
| Kettle Corn | [JSON](../../backend/recipes/web-import-2026-10-16/bbe0ed3d-78c1-5fd8-bc81-895f178d0484.json) | [Recipe](https://publicdomainrecipes.com/kettlecorn/) |
| Lebanese Lentil Soup | [JSON](../../backend/recipes/web-import-2026-10-16/a72b55ae-a864-5836-9e2a-15b54a209ea1.json) | [Recipe](https://publicdomainrecipes.com/lebanese-lentil-soup/) |
| Lemon and oregano chicken traybake | [JSON](../../backend/recipes/web-import-2026-10-16/b0d44abd-d01e-599c-bd40-e07e3d92f60f.json) | [Recipe](https://publicdomainrecipes.com/lemon-and-oregano-chicken-traybake/) |
| Lenten Chili | [JSON](../../backend/recipes/web-import-2026-10-16/1d51735b-75b1-5a21-9c2c-6ab51e3c8c02.json) | [Recipe](https://publicdomainrecipes.com/lenten-chili/) |
| Loaded Mexican Rice | [JSON](../../backend/recipes/web-import-2026-10-16/faa66548-c8e1-55f9-87c0-cc9e7b2aa5a5.json) | [Recipe](https://publicdomainrecipes.com/loaded-mexican-rice/) |
| Mapo Tofu (麻婆豆腐) | [JSON](../../backend/recipes/web-import-2026-10-16/05130fd0-6a6b-5dcb-abf2-caafb70b2260.json) | [Recipe](https://publicdomainrecipes.com/mapo-tofu/) |
| Mushroom Stroganov | [JSON](../../backend/recipes/web-import-2026-10-16/1e167fb3-4099-5f77-91d7-cd49e76f440d.json) | [Recipe](https://publicdomainrecipes.com/mushroom-stragonov/) |
| Naan Bread | [JSON](../../backend/recipes/web-import-2026-10-16/7780b73e-7f25-5d6e-b244-75e66769f162.json) | [Recipe](https://publicdomainrecipes.com/naan-bread/) |
| Newfoundland Cod Chowder | [JSON](../../backend/recipes/web-import-2026-10-16/d596481e-978f-53a0-927c-e06ae3121c69.json) | [Recipe](https://publicdomainrecipes.com/newfoundland-cod-chowder/) |
| No-knead Bread | [JSON](../../backend/recipes/web-import-2026-10-16/5f8e70cb-1e4c-55cd-8dc8-45833c6281c7.json) | [Recipe](https://publicdomainrecipes.com/no-knead-bread/) |
| Oatmeal Cookies | [JSON](../../backend/recipes/web-import-2026-10-16/045b94d7-edec-5540-b690-5012055f0fb5.json) | [Recipe](https://publicdomainrecipes.com/oatmeal-cookies/) |
| Oatmeal Pancakes | [JSON](../../backend/recipes/web-import-2026-10-16/b65d5074-f44d-5a4b-8bdf-79b647bdf5c3.json) | [Recipe](https://publicdomainrecipes.com/oatmeal-pancakes/) |
| Omelet | [JSON](../../backend/recipes/web-import-2026-10-16/7b9fcc57-6b6a-56f4-b426-aeb62d74e41a.json) | [Recipe](https://publicdomainrecipes.com/omelet/) |
| One-Pot Chicken Tetrazzini | [JSON](../../backend/recipes/web-import-2026-10-16/805b4b4d-5823-5dfe-80f4-af8e0c91e306.json) | [Recipe](https://publicdomainrecipes.com/one-pot-chicken-tetrazzini/) |
| Panang-Style Beef Curry | [JSON](../../backend/recipes/web-import-2026-10-16/b4bb352b-0660-5c84-99ed-fcd5d6ed2e5a.json) | [Recipe](https://publicdomainrecipes.com/panang-style-beef-curry/) |
| Pancake | [JSON](../../backend/recipes/web-import-2026-10-16/a90f7804-08d0-51b7-9606-c914902ba11d.json) | [Recipe](https://publicdomainrecipes.com/pancake/) |
| Pasta Alla Norma | [JSON](../../backend/recipes/web-import-2026-10-16/1519578f-bd35-5ebe-86e7-a705cd4fdc1e.json) | [Recipe](https://publicdomainrecipes.com/pasta-alla-norma/) |
| Pavlova | [JSON](../../backend/recipes/web-import-2026-10-16/f22b632f-f2fe-5da8-ad41-96900dbda6f7.json) | [Recipe](https://publicdomainrecipes.com/pavlova/) |
| Perfect Potato Salad | [JSON](../../backend/recipes/web-import-2026-10-16/fb052050-0ebc-52d4-91f5-35360caea6fc.json) | [Recipe](https://publicdomainrecipes.com/perfect-potato-salad/) |
| Potato Leek Soup | [JSON](../../backend/recipes/web-import-2026-10-16/213407c4-1b5f-5797-9e7c-f02172608987.json) | [Recipe](https://publicdomainrecipes.com/potato-leek-soup/) |
| Ratatouille | [JSON](../../backend/recipes/web-import-2026-10-16/2bfc1ed1-e30a-55bf-b85f-9f29a1b101d8.json) | [Recipe](https://publicdomainrecipes.com/ratatouille/) |
| Red Lentil Dahl | [JSON](../../backend/recipes/web-import-2026-10-16/b3522a03-5138-57fb-87ba-204d4e48cffd.json) | [Recipe](https://publicdomainrecipes.com/red-lentil-dahl/) |
| Rösti | [JSON](../../backend/recipes/web-import-2026-10-16/33a37ed6-8526-585f-9a97-7742504cf256.json) | [Recipe](https://publicdomainrecipes.com/roesti/) |
| Salsa | [JSON](../../backend/recipes/web-import-2026-10-16/2c62b010-a9ea-59e0-82f3-50e9a27bbcc6.json) | [Recipe](https://publicdomainrecipes.com/salsa/) |
| Salsa Verde | [JSON](../../backend/recipes/web-import-2026-10-16/9612e94d-4a3a-566f-9b99-4591115b1903.json) | [Recipe](https://publicdomainrecipes.com/salsa-verde/) |
| Schnitzel | [JSON](../../backend/recipes/web-import-2026-10-16/baac276b-b922-5c88-93f5-a7d537954ac9.json) | [Recipe](https://publicdomainrecipes.com/schnitzel/) |
| Shepherd's Pie | [JSON](../../backend/recipes/web-import-2026-10-16/73648f16-d569-5c52-be2a-efad74135ba5.json) | [Recipe](https://publicdomainrecipes.com/shepherds-pie/) |
| Shrimp Fettuccine Alfredo | [JSON](../../backend/recipes/web-import-2026-10-16/e7a62606-9f43-54a5-bc02-7cf8e4cf3ced.json) | [Recipe](https://publicdomainrecipes.com/shrimp-fettuccine-alfredo/) |
| Shrimp and Chicken Jambalaya | [JSON](../../backend/recipes/web-import-2026-10-16/09475265-0cee-5389-8b65-eb5277d18737.json) | [Recipe](https://publicdomainrecipes.com/shrimp-and-chicken-jambalaya/) |
| Shrimp and Grits | [JSON](../../backend/recipes/web-import-2026-10-16/dcf2629b-86ac-5238-8bf3-5b2d86b9876e.json) | [Recipe](https://publicdomainrecipes.com/shrimp-and-grits/) |
| Shrimp and Sausage Gumbo | [JSON](../../backend/recipes/web-import-2026-10-16/c4a149f1-cd23-541e-9260-422653d588e1.json) | [Recipe](https://publicdomainrecipes.com/gumbo-shrimp-and-sausage/) |
| Simple Chicken Curry | [JSON](../../backend/recipes/web-import-2026-10-16/7374b1c9-155c-592d-a747-d16bb268070c.json) | [Recipe](https://publicdomainrecipes.com/simple-chicken-curry/) |
| Simple Tuna Salad | [JSON](../../backend/recipes/web-import-2026-10-16/e0fcd9c3-2712-5d4e-b1a8-0e631c285787.json) | [Recipe](https://publicdomainrecipes.com/tuna-salad/) |
| Slow-cooked Pork Carnitas | [JSON](../../backend/recipes/web-import-2026-10-16/360668b1-e2f3-56aa-b79d-6a778d01ba68.json) | [Recipe](https://publicdomainrecipes.com/pork-carnitas/) |
| Smoked Salmon Pasta Primavera | [JSON](../../backend/recipes/web-import-2026-10-16/96c55253-3e09-5d29-b2ee-e5cc77d2f235.json) | [Recipe](https://publicdomainrecipes.com/smoked-salmon-pasta-primavera/) |
| Smoked Salmon Quiche | [JSON](../../backend/recipes/web-import-2026-10-16/8c94c3e9-67a5-5009-9fe6-9799ef8b583e.json) | [Recipe](https://publicdomainrecipes.com/smoked-salmon-quiche/) |
| Southern Biscuits | [JSON](../../backend/recipes/web-import-2026-10-16/8436b356-66c5-581a-aa71-7f0b9a72b467.json) | [Recipe](https://publicdomainrecipes.com/southern-biscuits/) |
| Spaghetti Sauce | [JSON](../../backend/recipes/web-import-2026-10-16/5aeba34f-8f82-50ac-bea8-a18351f78d4c.json) | [Recipe](https://publicdomainrecipes.com/spaghetti-sauce/) |
| Spaghetti aglio e olio | [JSON](../../backend/recipes/web-import-2026-10-16/c9f1cffa-f38c-54e0-afd4-b3b165ef79c8.json) | [Recipe](https://publicdomainrecipes.com/aglio-e-olio/) |
| Spaghetti alla puttanesca | [JSON](../../backend/recipes/web-import-2026-10-16/d327937d-9bf2-533d-80e8-bad979bd3160.json) | [Recipe](https://publicdomainrecipes.com/spaghetti-alla-puttanesca/) |
| Spaghetti and Meatballs | [JSON](../../backend/recipes/web-import-2026-10-16/bf4bdc7f-7368-5810-af26-b9c6af6ab3f4.json) | [Recipe](https://publicdomainrecipes.com/spaghetti-and-meatballs/) |
| Spanish Tortilla | [JSON](../../backend/recipes/web-import-2026-10-16/efdca566-9264-5104-b844-f2aed8939e68.json) | [Recipe](https://publicdomainrecipes.com/spanish-tortilla/) |
| Spatchcock Chicken | [JSON](../../backend/recipes/web-import-2026-10-16/d89756e3-c4b7-59b1-bd71-d7cdc80b2a28.json) | [Recipe](https://publicdomainrecipes.com/spatchcock-chicken/) |
| Spiced Apple Pancakes | [JSON](../../backend/recipes/web-import-2026-10-16/c4ea69e6-05c0-559b-9d5a-4c3a3087b1d1.json) | [Recipe](https://publicdomainrecipes.com/spiced-apple-pancakes/) |
| Spicy Kung Pao-Style Chicken | [JSON](../../backend/recipes/web-import-2026-10-16/afd6a4d2-82d9-5afa-989e-55534f363f6c.json) | [Recipe](https://publicdomainrecipes.com/spicy-kung-pao-style-chicken/) |
| Spicy Sausage Pasta | [JSON](../../backend/recipes/web-import-2026-10-16/7840e0b0-b049-5e61-99e0-99a27242f20d.json) | [Recipe](https://publicdomainrecipes.com/spicy-sausage-pasta/) |
| Spinach-Rice Casserole | [JSON](../../backend/recipes/web-import-2026-10-16/af0574fa-95ae-5e52-9747-f61ce598605a.json) | [Recipe](https://publicdomainrecipes.com/spinach-rice-casserole/) |
| Stracciatella soup | [JSON](../../backend/recipes/web-import-2026-10-16/1c181f95-b2d9-53a3-9531-76c471f667f8.json) | [Recipe](https://publicdomainrecipes.com/stracciatella-soup/) |
| Swedish Pancakes | [JSON](../../backend/recipes/web-import-2026-10-16/244a94ea-95f7-5fb1-aa8a-9c112fa4a607.json) | [Recipe](https://publicdomainrecipes.com/swedish-pancakes/) |
| Tabouleh | [JSON](../../backend/recipes/web-import-2026-10-16/d3271306-d4ab-53bc-a4b6-ef2e58b32b05.json) | [Recipe](https://publicdomainrecipes.com/tabouleh/) |
| Taco Meat | [JSON](../../backend/recipes/web-import-2026-10-16/00c6ef50-ceb9-5e97-8a21-c44386a41a24.json) | [Recipe](https://publicdomainrecipes.com/taco-meat/) |
| Three Bean Salad | [JSON](../../backend/recipes/web-import-2026-10-16/9f089a80-786b-5083-a8fd-56dc473d379f.json) | [Recipe](https://publicdomainrecipes.com/bean-salad/) |
| Tofu and Cashew Chow Mein | [JSON](../../backend/recipes/web-import-2026-10-16/a5dfa362-08c5-5551-9975-9ff8528fed18.json) | [Recipe](https://publicdomainrecipes.com/tofu-and-cashew-chow-mein/) |
| Tomato and Grilled Bell Pepper soup | [JSON](../../backend/recipes/web-import-2026-10-16/db3be7ae-fef2-521c-a311-da48b5ed4991.json) | [Recipe](https://publicdomainrecipes.com/tomato-and-grilled-paprika-soup/) |
| Turkish Red Lentil Soup | [JSON](../../backend/recipes/web-import-2026-10-16/ed732198-aed7-5078-94db-cb5ed3da9349.json) | [Recipe](https://publicdomainrecipes.com/turkish-red-lentil-soup/) |
| Ukrainian Borscht | [JSON](../../backend/recipes/web-import-2026-10-16/ec4492fe-a9bc-506c-8e72-d35251eb9f3d.json) | [Recipe](https://publicdomainrecipes.com/ukrainian-borscht/) |
| Valencian Paella | [JSON](../../backend/recipes/web-import-2026-10-16/37d01286-3716-5b11-aa42-dfe19fe90bfd.json) | [Recipe](https://publicdomainrecipes.com/paella/) |
| Winter Risotto | [JSON](../../backend/recipes/web-import-2026-10-16/d14fa1dc-86b1-5bba-a544-a198db3684ec.json) | [Recipe](https://publicdomainrecipes.com/winter-risotto/) |
| Yorkshire Puddings | [JSON](../../backend/recipes/web-import-2026-10-16/20594c7f-bf51-5bb3-9100-a11545fe8d32.json) | [Recipe](https://publicdomainrecipes.com/yorkshire-puddings/) |
