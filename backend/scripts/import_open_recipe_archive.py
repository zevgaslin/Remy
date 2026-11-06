#!/usr/bin/env python3
"""Download a pinned data-only archive, validate and stage exactly 1,000 recipes."""
import argparse
from collections import Counter
import datetime as dt
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import re
import tempfile
import urllib.request
import uuid
from jsonschema.exceptions import ValidationError

from jsonschema import Draft202012Validator, FormatChecker

BACKEND = Path(__file__).resolve().parents[1]
REPO = 'https://github.com/AdamBouhmad/open-recipe-archive'
REVISION = 'ae3bd2c009a8899dfe63b9166fa98ae3fa8041a8'
COLLECTIONS = ('ye-old-american', 'canadian-kitchen')
COLLECTION = COLLECTIONS[0]
DATA_PATH = f'collections/{COLLECTION}/recipes.jsonl'
DATA_URL = f'https://raw.githubusercontent.com/AdamBouhmad/open-recipe-archive/{REVISION}/{DATA_PATH}'
# Exclude preservation, medicinal advice, hazardous historical ingredients and dependent methods.
EXCLUDE = re.compile(r'peach[- ]leaves|laurel[- ]leaves|bitter almonds|saltpet(?:er|re)|borax|\blye\b|\balum\b|\bmercury\b|\bturpentine\b|\bparaffin\b|\bkerosene\b|\bsuet pudding cloth\b|\bcanning\b|\bpreserv(?:e|es|ing)\b|\bpickl(?:e|es|ing)\b|\braw (?:eggs?|meat)\b|\binvalids?\b|\bremedy\b|\bmedical\b|as (?:above|before|directed|described)|preceding recipe|following recipe|see (?:recipe|page)|recipe (?:no|number)|\bred.hot iron\b', re.I)
NUMBER = r'(?:\d+\s+\d+/\d+|\d+/\d+|\d+(?:\.\d+)?)'
WORDS = {'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'a':1,'an':1}
UNITS = r'(?:tablespoons?|teaspoons?|table-spoonfuls?|tea-spoonfuls?|cups?|cupfuls?|pounds?|ounces?|quarts?|pints?|gills?|tablespoonfuls?|teaspoonfuls?|tbsp|tsp|lbs?\.?|oz\.?|pts?\.?|qts?\.?|doz\.?|cloves?|slices?|cans?)'

def ingredient(line):
    """Parse only explicit simple amounts; preserve original text for every line."""
    text = line.strip()
    normalized = text
    for word, value in WORDS.items():
        normalized = re.sub(r'^'+word+r'\s+', str(value)+' ', normalized, flags=re.I)
    normalized = re.sub(r'^half (?:a |an )?', '1/2 ', normalized, flags=re.I)
    normalized = re.sub(r'^1 quarter of 1 ', '1/4 ', normalized)
    match = re.match(r'^('+NUMBER+r')\s+(.*)$', normalized)
    amount = quantity_text = unit = None
    name = text
    if match and not re.match(r'^(?:or\b|to\b|and\b|[-–]|\d)', match[2]):
        amount = float(sum(Fraction(part) for part in match[1].split()))
        if amount <= 0: raise ValueError('nonpositive quantity')
        quantity_text, name = text[:len(text)-len(match[2])].strip(), match[2]
        unit_match = re.match(r'^('+UNITS+r')\s+(?:of\s+)?(.+)$', name, re.I)
        if unit_match: unit, name = unit_match.groups()
    if re.search(r'\bor\b', normalized) and quantity_text is not None:
        amount, unit, name, quantity_text = None, None, text, text
    return dict(name=name, originalText=text, quantity=amount, quantityText=quantity_text,
                unit=unit, preparation=None, section=None, optional=bool(re.search(r'\boptional\b', text, re.I)))

def split_body(body):
    parts = re.fullmatch(r'\s*## Ingredients\s*\n(.*?)\n## Directions\s*\n(.*?)\s*', body, re.S)
    if not parts: raise ValueError('unexpected sections')
    ingredients, steps = [], []
    for content, target, pattern in [(parts[1], ingredients, r'^-\s+(.+)$'), (parts[2], steps, r'^\d+\.\s+(.+)$')]:
        for line in content.splitlines():
            if not line.strip(): continue
            match = re.fullmatch(pattern, line.strip())
            if not match: raise ValueError('unparsed content')
            target.append(match[1])
    if len(ingredients) < 2 or len(steps) < 3: raise ValueError('too few ingredients or steps')
    if len(' '.join(steps).split()) < 60: raise ValueError('very short method')
    return ingredients, steps

def convert(row, imported_at):
    if row.get('license') != 'public-domain': raise ValueError('license not accepted')
    for field in ('title','slug','body','source_url','source_title','source_year'):
        if not isinstance(row.get(field), str) or not row[field].strip(): raise ValueError('missing '+field)
    if row.get('collection') not in COLLECTIONS or not re.fullmatch(r'[a-z0-9-]+', row['slug']): raise ValueError('unexpected identity')
    if EXCLUDE.search(row['title']+' '+row['body']): raise ValueError('historical risk or dependent method')
    raw, steps = split_body(row['body'])
    ingredients = [ingredient(line) for line in raw]
    if sum(i['quantityText'] is not None for i in ingredients) < len(ingredients)/2: raise ValueError('mostly unspecified quantities')
    url = f"{REPO}/blob/{REVISION}/collections/{row['collection']}/recipes/{row['slug']}.md"
    identity = f"{REPO}/collections/{row['collection']}/{row['slug']}"
    return dict(schemaVersion=1, id=str(uuid.uuid5(uuid.NAMESPACE_URL,identity)), name=row['title'],
        description=f"Historical recipe from {row['source_title']} ({row['source_year']}). Source method; not modernized or kitchen-tested.",
        cuisine=None, mealType=None, difficulty=None, prepMinutes=None, cookMinutes=None, totalMinutes=None,
        servings=None, yieldText=None, ingredients=ingredients,
        instructions=[dict(text=text,section=None) for text in steps],
        preferenceTags=[dict(name='category',value='historical')],
        keywords=sorted(set(['historical']+[str(t).lower() for t in row.get('tags',[]) if str(t).strip()])),
        nutrition=None, imageUrl=None,
        source=dict(kind='website',url=url,siteName='Open Recipe Archive',author=row.get('author') or None,
            importedAt=imported_at, originalInstructions='\n'.join(f'{i}. {s}' for i,s in enumerate(steps,1)),
            originalIngredients=raw,license=row['license'],licenseUrl=f'{REPO}/blob/{REVISION}/LICENSE.md',
            instructionsOrigin='source',adaptationNotes=f"Original cookbook: {row['source_title']} ({row['source_year']}), {row['source_url']}. Archive revision: {REVISION}. Directions retained verbatim from the archive; historical methods have not received individual modern cooking review. Unknown nutrition, servings and timing remain null."))

def prepare(source, output, report_path, count=1000):
    rows = [json.loads(line) for line in source.read_text().splitlines() if line.strip()]
    validator = Draft202012Validator(json.loads((BACKEND/'src/main/resources/recipe.schema.json').read_text()),format_checker=FormatChecker())
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    selected, skipped, seen_names, seen_bodies = [], [], set(), set()
    # Hash order spreads selection across titles rather than taking the first alphabetic block.
    rows.sort(key=lambda r: hashlib.sha256((r.get('collection','')+'/'+r.get('slug','')).encode()).hexdigest())
    for row in rows:
        try:
            document = convert(row,now)
            name = re.sub(r'\W+',' ',document['name'].lower()).strip()
            body_hash = hashlib.sha256(row['body'].encode()).hexdigest()
            if name in seen_names or body_hash in seen_bodies: raise ValueError('duplicate title or content')
            validator.validate(document)
            previous = output/(document['id']+'.json')
            if previous.exists(): document['source']['importedAt'] = json.loads(previous.read_text())['source']['importedAt']
            seen_names.add(name); seen_bodies.add(body_hash); selected.append(document)
        except (ValueError, ArithmeticError, ValidationError) as error:
            skipped.append(dict(slug=row.get('slug'),reason=str(error)))
        if len(selected) == count: break
    report = dict(revision=REVISION,dataUrls=[DATA_URL.replace('/'+COLLECTION+'/', '/'+c+'/') for c in COLLECTIONS],sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
        requested=count,prepared=len(selected),available=len(rows),skipCounts=dict(Counter(s['reason'] for s in skipped)),
        skipped=skipped,selected=[dict(id=d['id'],name=d['name'],url=d['source']['url']) for d in selected],
        quality='Structural and conservative automated filtering only; historical source methods, not individually modernized or kitchen-tested.')
    report_path.parent.mkdir(parents=True,exist_ok=True)
    report_path.write_text(json.dumps(report,indent=2)+'\n')
    if len(selected)!=count: raise ValueError(f'Only {len(selected)}/{count} eligible recipes. Nothing staged; see {report_path}')
    output.mkdir(parents=True,exist_ok=True)
    expected={d['id']+'.json' for d in selected}
    if {p.name for p in output.glob('*.json')} - expected: raise ValueError('Output contains unexpected recipes; use a clean output directory')
    for document in selected:
        target=output/(document['id']+'.json')
        with tempfile.NamedTemporaryFile(mode='w',dir=output,delete=False,suffix='.tmp') as handle:
            json.dump(document,handle,indent=2,ensure_ascii=False);handle.write('\n');temp=Path(handle.name)
        temp.replace(target)
    print(f'Prepared and schema-validated {len(selected)} recipes in {output}',flush=True)
    print(f'Report: {report_path}',flush=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,help='Use an already downloaded JSONL instead of fetching')
    parser.add_argument('--output',type=Path,default=BACKEND/'recipes/open-recipe-archive')
    parser.add_argument('--report',type=Path,default=BACKEND.parent/'docs/recipes/open-recipe-archive-report.json')
    args=parser.parse_args()
    source=args.source or BACKEND/'data/open-recipe-archive'/REVISION/'recipes.jsonl'
    if not source.exists():
        if args.source: raise FileNotFoundError(source)
        source.parent.mkdir(parents=True,exist_ok=True)
        contents=[]
        for collection in COLLECTIONS:
            url=DATA_URL.replace('/'+COLLECTION+'/', '/'+collection+'/')
            request=urllib.request.Request(url,headers={'User-Agent':'RemyRecipeImporter/1.0'})
            with urllib.request.urlopen(request,timeout=120) as response: contents.append(response.read().rstrip()+b'\n')
        source.write_bytes(b''.join(contents))
    prepare(source,args.output,args.report)

if __name__=='__main__': main()
