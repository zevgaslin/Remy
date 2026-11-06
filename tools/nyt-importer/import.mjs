// Offline JSON-LD importer inspired by BrianVia/nyt-cooking-parser.
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function extract(html) {
  const nodes = [];
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== 'object') return;
    if ([value['@type']].flat().includes('Recipe')) nodes.push(value);
    if (value['@graph']) visit(value['@graph']);
  }
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (!/\btype\s*=\s*["']application\/ld\+json["']/i.test(match[1])) continue;
    try { visit(JSON.parse(match[2])); } catch { /* Report missing recipe below. */ }
  }
  const steps = value => [value ?? []].flat().flatMap(item =>
    typeof item === 'string' ? [item] : item?.itemListElement
      ? steps(item.itemListElement) : item?.text ? [item.text] : []);
  return nodes.map(r => {
    const rawUrl = r.url || r.mainEntityOfPage?.['@id'] || r['@id'];
    let url;
    try {
      const parsed = new URL(rawUrl);
      if (parsed.hostname !== 'cooking.nytimes.com' || !/^\/recipes\/\d+/.test(parsed.pathname)) return null;
      url = `https://cooking.nytimes.com${parsed.pathname}`;
    } catch { return null; }
    const ingredients = [r.recipeIngredient ?? []].flat().filter(x => typeof x === 'string' && x.trim());
    const instructions = steps(r.recipeInstructions);
    if (!r.name || !ingredients.length || !instructions.length) return null;
    return {
      url, name: r.name, description: r.description ?? '',
      author: [r.author ?? []].flat().map(a => typeof a === 'string' ? a : a.name).filter(Boolean).join(', '),
      image: r.image, recipeYield: r.recipeYield,
      prepTime: r.prepTime, cookTime: r.cookTime, totalTime: r.totalTime,
      ingredients, instructions, nutrition: r.nutrition,
      tags: [...new Set([r.keywords ?? [], r.recipeCategory ?? []].flat(2).flatMap(x => String(x).split(',')).map(x => x.trim()).filter(Boolean))],
      rating: r.aggregateRating?.ratingValue, ratingCount: r.aggregateRating?.ratingCount,
    };
  }).filter(Boolean);
}

async function main() {
  const [input, output = './output', limitArg = '1000'] = process.argv.slice(2);
  const limit = Number(limitArg);
  if (!input || !Number.isInteger(limit) || limit < 1 || limit > 1000)
    throw new Error('Usage: node import.mjs INPUT_FOLDER [OUTPUT_FOLDER] [LIMIT: 1–1000]');
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && /\.html?$/i.test(entry.name)) files.push(full);
    }
  }
  await walk(path.resolve(input));
  const recipes = new Map(), skipped = [];
  let duplicates = 0;
  for (const file of files.sort()) {
    if (recipes.size >= limit) break;
    const found = extract(await readFile(file, 'utf8'));
    if (!found.length) skipped.push({ file: path.relative(input, file), reason: 'No complete NYT Recipe JSON-LD with canonical URL' });
    for (const recipe of found) {
      const id = recipe.url.match(/\/recipes\/(\d+)/)[1];
      if (recipes.has(id)) { duplicates++; continue; }
      if (recipes.size >= limit) break;
      recipes.set(id, recipe);
    }
  }
  await mkdir(output, { recursive: true });
  const report = { target: limit, imported: recipes.size, complete: recipes.size === limit,
    ranking: 'Unranked; input selection supplied by user. No popularity claim.',
    filesAvailable: files.length, duplicates, skipped };
  await writeFile(path.join(output, 'nyt-recipes.json'), JSON.stringify([...recipes.values()], null, 2));
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`Imported ${recipes.size}/${limit}; ${duplicates} duplicates; ${skipped.length} skipped. Output: ${path.resolve(output)}`);
  if (!report.complete) process.exitCode = 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
