#!/usr/bin/env bash
# Fetch data, validate exactly 1,000 recipes, then transactionally import and verify.
set -euo pipefail
cd "$(dirname "$0")/.."
venv="data/open-recipe-archive/venv"
if [[ ! -x "$venv/bin/python" ]]; then
  python3 -m venv "$venv"
fi
if ! "$venv/bin/python" -c 'import jsonschema; assert jsonschema.__version__ == "4.26.0"' 2>/dev/null; then
  "$venv/bin/python" -m pip install -r scripts/open-recipe-archive/requirements.txt
fi
"$venv/bin/python" scripts/import_open_recipe_archive.py
exec ./scripts/import-recipes.sh "$PWD/recipes/open-recipe-archive"
