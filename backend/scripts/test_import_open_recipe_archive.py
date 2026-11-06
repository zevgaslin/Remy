import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('ora',Path(__file__).with_name('import_open_recipe_archive.py'))
ora=importlib.util.module_from_spec(spec)
spec.loader.exec_module(ora)

class ArchiveImportTest(unittest.TestCase):
    def row(self,slug='example'):
        return dict(title='Example '+slug,slug=slug,collection='ye-old-american',license='public-domain',
            source_url='https://www.gutenberg.org/ebooks/1',source_title='Example book',source_year='1900',
            author='Example',tags=['american-historical'],
            body='## Ingredients\n\n- 2 cups rice\n- 4 cups water\n\n## Directions\n\n1. Wash the rice in cold water and drain it in a sieve before placing it in a saucepan with a lid.\n2. Add the water and bring it to a boil, then lower the heat, cover and cook for twenty minutes until tender.\n3. Remove the pan from the heat, rest it for five minutes, then lift the lid and serve the rice warm with a spoon.')
    def test_source_preserved_and_metadata_unknown(self):
        row=self.row();doc=ora.convert(row,'2026-11-06T00:00:00+00:00')
        self.assertEqual(doc['ingredients'][0]['quantity'],2)
        self.assertEqual(doc['ingredients'][0]['name'],'rice')
        self.assertEqual(doc['ingredients'][0]['originalText'],'2 cups rice')
        self.assertEqual(len(doc['instructions']),3)
        self.assertIsNone(doc['nutrition']);self.assertIsNone(doc['servings'])
        self.assertIn(ora.REVISION,doc['source']['url'])
    def test_ambiguous_quantity_stays_unknown(self):
        item=ora.ingredient('4 doz. or 1 pt. small oysters')
        self.assertIsNone(item['quantity'])
        self.assertEqual(item['originalText'],'4 doz. or 1 pt. small oysters')
        self.assertEqual(ora.ingredient('one cupful of rice')['name'],'rice')

    def test_incomplete_and_unparsed_content_rejected(self):
        for body in ['## Ingredients\n- water',self.row()['body']+'\nUnparsed note']:
            row=self.row();row['body']=body
            with self.assertRaises(ValueError):ora.convert(row,'2026-11-06T00:00:00+00:00')
    def test_license_and_historical_exclusions(self):
        for patch in [dict(license='unknown'),dict(title='Peach leaves'),dict(title='As directed above')]:
            row=self.row();row.update(patch)
            with self.assertRaises(ValueError):ora.convert(row,'2026-11-06T00:00:00+00:00')
    def test_rerun_deduplicates_and_keeps_timestamp(self):
        with tempfile.TemporaryDirectory() as tmp:
            base=Path(tmp);source=base/'input.jsonl';out=base/'recipes';report=base/'report.json'
            source.write_text('\n'.join(json.dumps(r) for r in [self.row(),self.row('duplicate')]))
            ora.prepare(source,out,report,count=1)
            before=next(out.glob('*.json')).read_bytes()
            ora.prepare(source,out,report,count=1)
            self.assertEqual(before,next(out.glob('*.json')).read_bytes())
            self.assertEqual(len(list(out.glob('*.json'))),1)
            # Same content under two IDs cannot satisfy a two-recipe target.
            with self.assertRaises(ValueError):ora.prepare(source,base/'other',report,count=2)
            self.assertFalse((base/'other').exists())

if __name__=='__main__':unittest.main()
