#!/usr/bin/env python3
"""Prepare reviewed public-domain website recipes for Remy's JSON catalog.

Dependencies: scripts/recipe-import-requirements.txt. Only data is fetched; no remote code runs.
"""
import argparse, concurrent.futures, datetime, hashlib, json, re, time, urllib.request, urllib.parse, uuid
from fractions import Fraction
from pathlib import Path
from bs4 import BeautifulSoup
from jsonschema import Draft202012Validator, FormatChecker

def fetch(item):
 slug=item['url'].rstrip('/').split('/')[-1];path=root/(slug+'.html')
 if not path.exists():
  req=urllib.request.Request(item['url'],headers={'User-Agent':'RemyRecipeImporter/1.0 (personal recipe catalog; public-domain content)'})
  for attempt in range(3):
   try:
    with urllib.request.urlopen(req,timeout=25) as response:path.write_bytes(response.read())
    break
   except Exception:
    if attempt==2:raise
    time.sleep(1+attempt)
  time.sleep(.2)
 soup=BeautifulSoup(path.read_text(),'html.parser');article=soup.find('article')
 h=article.find(['h2','h3'],id='ingredients');ingredients=[];section=None
 if h:
  for sibling in h.next_siblings:
   if getattr(sibling,'name',None)=='h2':break
   if getattr(sibling,'name',None)=='h3':section=sibling.get_text(' ',strip=True)
   if getattr(sibling,'name',None) in ('ul','ol'):
    for li in sibling.find_all('li',recursive=False): ingredients.append({'text':li.get_text(' ',strip=True),'section':section})
 h=article.find(['h2','h3'],id='directions');steps=[];section=None
 if h:
  for sibling in h.next_siblings:
   if getattr(sibling,'name',None)=='h2':break
   if getattr(sibling,'name',None)=='h3':section=sibling.get_text(' ',strip=True)
   if getattr(sibling,'name',None) in ('ol','ul'):
    for li in sibling.find_all('li',recursive=False):steps.append({'text':li.get_text(' ',strip=True),'section':section})
   elif getattr(sibling,'name',None)=='p' and sibling.get_text(strip=True):steps.append({'text':sibling.get_text(' ',strip=True),'section':section})
 authors=[]
 h=article.find('h2',string=lambda t:t and 'Contributor' in t)
 if h:
  ul=h.find_next_sibling('ul')
  if ul:
   for li in ul.find_all('li',recursive=False):
    copied=BeautifulSoup(str(li),'html.parser').li
    for child in copied.find_all(['ul','code']):child.decompose()
    authors.append(copied.get_text(' ',strip=True))
 meta={}
 for li in article.select('ul > li'):
  text=li.get_text(' ',strip=True)
  for key in ['Prep time','Cook time','Servings']:
   if key+':' in text:meta[key]=text.split(key+':',1)[1].strip()
 tags=[a.get_text(' ',strip=True) for a in article.select('.taglist a')]
 desc=[]
 for child in article.children:
  if getattr(child,'name',None)=='h2':break
  if getattr(child,'name',None)=='p' and not child.find('img'):desc.append(child.get_text(' ',strip=True))
 image=article.find('img');imageurl=urllib.parse.urljoin(item['url'],image['src']) if image else None
 item.update(ingredients=ingredients,steps=steps,authors=authors,metadata=meta,tags=tags,description=' '.join(desc) or None,imageUrl=imageurl)
 (root/(slug+'.json')).write_text(json.dumps(item,indent=2,ensure_ascii=False))
 return item
FRACTIONS={'½':'1/2','¼':'1/4','¾':'3/4','⅓':'1/3','⅔':'2/3','⅛':'1/8','⅜':'3/8','⅝':'5/8','⅞':'7/8'}
NUMBER=r'(?:\d+\s+\d+/\d+|\d+/\d+|\d+(?:\.\d+)?)'
UNITS=r'(?:tablespoons?|table spoons?|tblsps?|tbsp\.?|teaspoons?|tea spoons?|tsps?\.?|Tsp|Tbsp|cups?|c\b|milliliters?|millilitres?|ml|mL|liters?|litres?|litres?|l\b|deciliters?|dl|cl\b|grams?|g\b|kilograms?|kg|ounces?|oz\.?|pounds?|lbs?\.?|cloves?|sticks?|slices?|cans?|tins?|packets?|packages?|pcks|pkg|sprigs?|bunch(?:es)?|heads?|ribs?|stalks?|pinch(?:es)?|dashes?|quarts?|pints?|glasses?|glass|shots?|inch(?:es)?|cm|T\b|t\b)'

def numeric(text):
    return float(sum(Fraction(part) for part in text.split()))

def parse_ingredient(original,section):
    text=re.sub(r'\s+',' ',original).strip().rstrip('.')
    optional=bool(re.search(r'\boptional\b',text,re.I))
    text=re.sub(r'^\(optional\)\s*','',text,flags=re.I)
    text=re.sub(r'\s*\(optional(?:[^)]*)\)','',text,flags=re.I)
    for char,value in FRACTIONS.items():text=text.replace(char,' '+value)
    text=re.sub(r'(?<![\d/])(\d+)\s*-\s*(\d+/\d+)\b',r'\1 \2',text)
    text=re.sub(r'\s+',' ',text).strip()
    text=re.sub(r'^(One|one|a|A|an)\b','1',text)
    text=re.sub(r'^half a\b','1/2',text,flags=re.I)
    text=text.replace('2 and 1/4','2 1/4')
    text=text.strip(' -')
    # A handful of source lines put the quantity after the ingredient rather than before it.
    reverse=re.match(r'^(.*?)\s+('+NUMBER+r')\s*('+UNITS+r')\s*$',text,re.I)
    if reverse and not re.match(r'^\d',text):text=reverse.group(2)+' '+reverse.group(3)+' '+reverse.group(1)
    salt=re.match(r'^(Salt)\s*-\s*(.*)$',text,re.I)
    if salt:text=salt.group(2)+' '+salt.group(1)
    bound='up to ' if re.match(r'^up to ',text,re.I) else ''
    text=re.sub(r'^up to ', '', text,flags=re.I)
    amount=re.match(r'^(~?'+NUMBER+r'(?:\s*[-–]\s*'+NUMBER+r')?)(.*)$',text)
    quantity=None;quantity_text=None;unit=None;preparation=[]
    if amount:
        quantity_text=amount.group(1).strip();text=amount.group(2).strip()
        if not re.search(r'[-–~]',quantity_text) and not bound:quantity=numeric(quantity_text)
        if bound:quantity_text=bound+quantity_text
        if text.startswith('+'):
            quantity=None
        packaged=re.match(r'^('+NUMBER+r')\s*(oz\.?|g)\s*(?:(?:large\s+)?(cans?|tins?|bottles?|packets?|packages?)\s+)?(.*)',text,re.I)
        if packaged:
            unit=packaged.group(3) or ('can' if packaged.group(4).startswith('canned') else 'package')
            preparation.append(packaged.group(1)+' '+packaged.group(2)+' source package size')
            text=packaged.group(4)
        multiplier=re.match(r'^x\s*('+NUMBER+r')\s*(g|oz)\s*(tins?|cans?)\s+(.*)',text,re.I)
        if multiplier:
            unit=multiplier.group(3).lower();preparation.append(multiplier.group(1)+' '+multiplier.group(2)+' per '+unit.rstrip('s'));text=multiplier.group(4)
        else:
            package=re.match(r'^\(([^)]+)\)\s*(cans?|tins?|packets?|packages?)\s+(.*)',text,re.I)
            if package:
                preparation.append(package.group(1)+' package size');unit=package.group(2).lower();text=package.group(3)
            else:
                match=re.match(r'^('+UNITS+r')(?=\s|[(/]|$)\s*(.*)',text,re.I)
                if match:unit=match.group(1).rstrip('.');text=match.group(2).strip()
                compound=re.match(r'^\+\s*('+NUMBER+r')\s*('+UNITS+r')\s+(.*)',text,re.I)
                if compound:
                    quantity_text+=' '+str(unit or '')+' + '+compound.group(1)+' '+compound.group(2)
                    quantity=None;unit=None;text=compound.group(3)
    # Keep ambiguous source quantities as text; do not invent unit conversions or package sizes.
    leading_parens=re.match(r'^\(([^)]+)\)\s*(.*)',text)
    if leading_parens:
        preparation.append(leading_parens.group(1));text=leading_parens.group(2)
    text=re.sub(r'^/\s*~?'+NUMBER+r'\s*(?:ml|g|milliliters?)\s+', '',text,flags=re.I)
    text=re.sub(r'^(?:of\s+|a\s+|an\s+)','',text,flags=re.I)
    size=re.match(r'^((?:(?:very\s+)?(?:small|medium|large|whole|ripe|fresh|cold|warm|dry|dried|uncooked|un-cooked|uncoocked|peeled|chopped|diced|minced|grated|shredded|sliced)\s+)+)(.*)',text,re.I)
    if size:preparation.append(size.group(1).strip());text=size.group(2)
    parts=re.split(r',\s*(?=(?:finely |roughly |thinly |coarsely )?(?:chopped|diced|minced|sliced|grated|shredded|divided|rinsed|drained|peeled|melted|beaten|cut|softened|plus|fresh preferred))',text,maxsplit=1,flags=re.I)
    text=parts[0]
    if len(parts)>1:preparation.append(parts[1])
    for part in re.findall(r'\(([^)]*)\)',text):preparation.append(part)
    text=re.sub(r'\([^)]*\)','',text).strip(' ,;')
    text=re.sub(r'^of\s+','',text,flags=re.I)
    text=re.sub(r'\s+',' ',text).strip()
    # Normalize obvious food-name spelling errors while retaining the original source line.
    text=text.replace('garlic gloves','garlic cloves').replace('Red Paper Flakes','Red Pepper Flakes').replace('giner syrup','ginger syrup')
    if re.fullmatch(r'(?:fresh\s+)?garlic\s+cloves?',text,re.I):
        text='Garlic';unit=unit or 'cloves'
    if re.match(r'^cloves?\s+(?:of\s+)?garlic$',text,re.I):text='Garlic';unit=unit or 'cloves'
    taste=re.search(r',?\s+to taste$',text,re.I)
    if taste:
        preparation.append('to taste');text=text[:taste.start()]
        if quantity_text is None:quantity_text='to taste'
    percent=re.match(r'^(\d+-\d+%)\s+(.*)',text)
    if percent:preparation.append(percent.group(1)+' chocolate content');text=percent.group(2)
    text=re.sub(r'^(?:some|hot)\s+','',text,flags=re.I)
    if text.lower()=='juice of 1 lemon':text='Lemon';quantity=1;quantity_text='1';unit='each';preparation.append('juiced')
    if text.lower().startswith('egg whites separated'):text='Egg whites';quantity=4;quantity_text='4';unit='each';preparation.append('use the whites from the same four eggs whose yolks are listed above')
    if text.lower().startswith('a pinch of'):text=text[len('a pinch of '):];quantity_text='a pinch';quantity=None
    if not text:raise ValueError('Ingredient name missing: '+original)
    text=text.strip(' -')
    unit={'T':'tbsp','t':'tsp'}.get(unit,unit)
    return dict(name=text[0].upper()+text[1:],originalText=original,quantity=quantity,quantityText=quantity_text,unit=unit,
                preparation='; '.join(preparation) or None,section=section,optional=optional)

def minutes(value):
    if not value:return None
    value=value.lower()
    if re.search(r'\d\s*[-–]\s*\d',value):return None
    hours=re.search(r'(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b',value)
    mins=re.search(r'(\d+)\s*(?:minutes?|mins?|m)\b',value)
    if hours or mins:return int(float(hours.group(1))*60 if hours else 0)+(int(mins.group(1)) if mins else 0)
    return int(value) if value.isdigit() else None

def food_safety(recipe):
    names=' '.join(i['text'] for i in recipe['ingredients']).lower()
    title=recipe['name'].lower()
    if 'fajitas' in title:
        return 'Before serving, check the thickest meat with a food thermometer: chicken must reach 165°F (74°C); beef steak must reach 145°F (63°C) and rest for 3 minutes. Continue cooking if needed, and use clean utensils for cooked meat.'
    if re.search(r'chicken|ground turkey|beef or turkey',names):
        return 'Before serving, insert a food thermometer into the thickest piece of chicken or turkey, away from bone: it must reach 165°F (74°C). If using already-cooked poultry, reheat it to 165°F (74°C). Continue cooking and recheck if needed; wash hands and utensils after handling raw poultry and do not rinse it.'
    if re.search(r'ground beef|minced lamb|beef mince|pork mince|veal mince|sausage|ground pork',names):
        return 'Before serving, check the center of the meat with a food thermometer. Ground beef, pork, and lamb must reach 160°F (71°C); use 165°F (74°C) for any poultry sausage. Continue cooking if needed, and wash hands and utensils after touching raw meat.'
    if re.search(r'boneless pork|pork shoulder',names):
        return 'Before serving, check pork with a food thermometer: whole cuts must reach at least 145°F (63°C) and rest for 3 minutes. For carnitas, continue the recipe’s longer cooking until the pork also pulls apart easily with forks.'
    if re.search(r'fish fillet|salmon fillet|cod fillet|uncooked.*shrimp|uncoocked.*shrimp|\bshrimp\b',names) and 'smoked salmon' not in names:
        return 'Before serving, check uncooked fish or shrimp with a food thermometer: it must reach 145°F (63°C). Fish should separate easily into flakes; shrimp should be opaque and firm. Continue cooking and recheck if needed.'
    if re.search(r'quiche|frittata|omelet|spanish tortilla|stracciatella|spinach-rice casserole|crème brûlée',title):
        return 'Before serving, check the center of the cooked egg mixture with a food thermometer: it must reach 160°F (71°C), with no runny raw egg. For a casserole containing reheated cooked meat, use 165°F (74°C). Continue cooking if needed.'
    return None

def build(recipe,imported_at):
    raw_ingredients=recipe['ingredients'];expanded=[]
    for item in raw_ingredients:
        if item['text'].startswith('Spices:'):
            for text in ['1 teaspoon cinnamon','1/4 teaspoon nutmeg','1/4 teaspoon ginger']:expanded.append({'text':text,'section':'Spices'})
        elif re.fullmatch(r'oven-safe pan|aluminum foil|tin foil',item['text'],re.I):continue
        else:expanded.append(item)
    ingredients=[parse_ingredient(i['text'],i['section']) for i in expanded]
    notes=['Ingredient amounts and original directions come from the linked public-domain page. Remy added preparation explanations, cooking-technique definitions, serving guidance, and applicable USDA thermometer checks. Unspecified quantities, serving counts, nutrition, and timing remain unknown. These adaptations have not been kitchen-tested.']
    directions=[dict(s) for s in recipe['steps']]
    if recipe['name']=='Basic Meatballs':
        for step in directions:step['text']=step['text'].replace('60°C/140F','71°C/160°F')
        notes.append('Corrected the source’s 140°F ground-meat endpoint to the USDA minimum of 160°F; the unmodified original is retained below.')
    instructions=[{'section':'Preparation','text':'Read the entire method first and measure the following ingredients before turning on the heat: '+ '; '.join(i['originalText'] for i in ingredients)+'. Keep ingredients marked optional separate until their step.'}]
    prep=[i['name']+': '+i['preparation'] for i in ingredients if i['preparation'] and re.search(r'chop|dice|mince|grate|shred|slice|peel|rinse|drain|melt|beat|cut',i['preparation'],re.I)]
    if prep:instructions.append({'section':'Preparation','text':'Prepare these ingredients before cooking: '+ '; '.join(prep)+'. Wash produce under running water before cutting. Use a cutting board and a sharp knife; keep raw meat and its utensils separate from ready-to-eat ingredients.'})
    if not prep:instructions.append({'section':'Preparation','text':'Set out the bowls, pans, measuring tools, and any baking equipment named in the steps below. Wash any fresh produce before use. Keep raw eggs, meat, and their utensils separate from ready-to-eat food.'})
    global_heat=bool(re.search(r'low|medium|high|°|degrees', ' '.join(s['text'] for s in directions),re.I))
    heat_added=False
    for step in directions:
        chunks=re.split(r'(?<=[.!?])\s+(?=[A-Z])',step['text'])
        for chunk in chunks:
            text=chunk.strip()
            if not text:continue
            if re.search(r'simmer',text,re.I) and not re.search(r'gentle|bubbl',text,re.I):text+=' A simmer means small, gentle bubbles; lower the burner if it boils vigorously.'
            if re.search(r'mince|dice',text,re.I) and not re.search(r'\d\s*(?:cm|mm|inch|\")',text,re.I):text+=' Mince means chop very finely; dice means cut into small, similarly sized pieces so they cook evenly.'
            if re.search(r'saut[ée]|saute',text,re.I):text+=' Stir frequently so the ingredients soften evenly without sticking or burning; reduce the heat if they darken too quickly.'
            if re.search(r'knead',text,re.I):text+=' To knead, push the dough away with the heel of your hand, fold it back, and turn it; repeat for the stated time or until it has the described texture.'
            if re.search(r'rolling boil',text,re.I):text+=' A rolling boil has large bubbles continuously breaking over the surface.'
            if re.search(r'cook.*pasta|boil.*pasta|cook.*noodles',text,re.I) and not re.search(r'\d\s*(?:min|minute)',text,re.I):text+=' Use the package cooking-time range, stir to separate the pasta, and taste a cooled piece near the end; it should be tender without a hard center.'
            if not global_heat and not heat_added and re.search(r'pan|skillet|fry|saut[ée]',text,re.I):
                text+=' For this stovetop step, start over medium heat and lower it if the food browns before the center cooks.';heat_added=True
            instructions.append({'text':text,'section':step['section']})
    safety=food_safety(recipe)
    if safety:
        insert=len(instructions)
        for index,step in enumerate(instructions):
            if index>=2 and re.match(r'^(?:serve|plate|enjoy|garnish|top with)',step['text'],re.I):insert=index;break
        instructions.insert(insert,{'section':'Check doneness','text':safety})
    instructions.append({'section':'Finish','text':'Turn off any burners or oven when cooking is finished. Follow the cooling or resting instruction above before cutting or serving. Serve the finished dish as directed; allow hot portions to cool enough to eat.'})
    tags=recipe['tags'];lower=[t.lower() for t in tags]
    cuisines={'american','italian','french','chinese','indian','mexican','thai','japanese','greek','mediterranean','cajun','lebanese','turkish','ukrainian','finnish','swedish','english','spanish','german','austrian','asian','middle eastern'}
    cuisine=next((t for t in tags if t.lower() in cuisines),None)
    title=recipe['name'].lower()
    meal='Dessert' if 'dessert' in lower or re.search(r'cookies|cake|muffin|crème brûlée|pavlova',title) else 'Breakfast' if 'breakfast' in lower or re.search(r'pancake|waffle|french toast|granola|omelet',title) else 'Side' if 'side' in lower or re.search(r'bread|biscuits|coleslaw|guacamole|salsa|salad|sauce',title) else 'Dinner'
    preferences=[{'name':'meal_type','value':meal.lower()}]
    if cuisine:preferences.append({'name':'cuisine','value':cuisine.lower()})
    for tag in tags:
        key='diet' if tag.lower() in {'vegan','vegetarian','gluten-free','dairy-free'} else 'category'
        value=tag.lower();entry={'name':key,'value':value}
        if entry not in preferences:preferences.append(entry)
    serving_text=recipe['metadata'].get('Servings');servings=None
    if serving_text and re.fullmatch(r'\d+(?:\.\d+)?(?:\s+(?:people|persons?|servings?))?',serving_text,flags=re.I):servings=float(serving_text.split()[0])
    yield_text=(serving_text+' servings' if serving_text and not re.search(r'[A-Za-z]',serving_text) else serving_text)
    description=recipe['description']
    if description and len(description)>240:description=description[:237].rsplit(' ',1)[0]+'...'
    original='\n'.join((s['section']+': ' if s['section'] else '')+f"{i+1}. "+s['text'] for i,s in enumerate(recipe['steps']))
    return dict(schemaVersion=1,id=str(uuid.uuid5(uuid.NAMESPACE_URL,recipe['url'])),name=recipe['name'],description=description,
        cuisine=cuisine,mealType=meal,difficulty='Easy' if 'easy' in lower else None,
        prepMinutes=minutes(recipe['metadata'].get('Prep time')),cookMinutes=minutes(recipe['metadata'].get('Cook time')),totalMinutes=None,
        servings=servings,yieldText=yield_text or None,ingredients=ingredients,instructions=instructions,
        preferenceTags=preferences,keywords=list(dict.fromkeys(lower+[title])),nutrition=None,imageUrl=recipe['imageUrl'],
        source=dict(kind='website',url=recipe['url'],siteName='Public Domain Recipes',author=', '.join(recipe['authors']) or None,
        importedAt=imported_at,originalInstructions=original,originalIngredients=[i['text'] for i in raw_ingredients],
        license='Public domain (Unlicense)',licenseUrl='https://github.com/ronaldl29/public-domain-recipes/blob/main/LICENSE.md',
        instructionsOrigin='adapted',adaptationNotes=' '.join(notes)))

def main():
    global root
    parser=argparse.ArgumentParser()
    parser.add_argument('--sources',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--cache-dir',type=Path,default=Path('/tmp/remy-source-recipes'))
    args=parser.parse_args();root=args.cache_dir;root.mkdir(parents=True,exist_ok=True)
    sources=json.loads(args.sources.read_text())
    if len({s['url'] for s in sources})!=len(sources):raise ValueError('Duplicate source URLs')
    for source in sources:
        url=urllib.parse.urlparse(source['url'])
        if url.scheme!='https' or url.netloc!='publicdomainrecipes.com':raise ValueError('This importer only accepts the reviewed public-domain source')
    schema=json.loads((Path(__file__).resolve().parents[1]/'src/main/resources/recipe.schema.json').read_text())
    validator=Draft202012Validator(schema,format_checker=FormatChecker())
    imported=datetime.datetime.now(datetime.timezone.utc).isoformat()
    documents=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        for index,recipe in enumerate(executor.map(fetch,sources),1):
            document=build(recipe,imported)
            if recipe.get('instructionsOverride'):
                document['instructions']=[{'section':None,'text':text} for text in recipe['instructionsOverride']]
                document['source']['adaptationNotes']+=' The method was rewritten in reviewed, explicit beginner steps using the source quantities.'
            for field,value in recipe.get('metadataOverrides',{}).items():document[field]=value
            if recipe.get('reviewNotes'):document['source']['adaptationNotes']+=' '+recipe['reviewNotes']
            validator.validate(document);documents.append(document)
            if index%20==0:print('Prepared',index,'validated recipes',flush=True)
    args.output.mkdir(parents=True,exist_ok=True)
    for document in documents:
        path=args.output/(document['id']+'.json')
        if path.exists():
            previous=json.loads(path.read_text());document['source']['importedAt']=previous['source']['importedAt']
        path.write_text(json.dumps(document,indent=2,ensure_ascii=False)+'\n')
    print('Wrote',len(documents),'validated recipe JSON files to',args.output,flush=True)

if __name__=='__main__':main()
