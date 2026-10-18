import unittest
from prepare_public_domain_batch import parse_ingredient

class IngredientParsingTests(unittest.TestCase):
    def test_fraction_range_is_not_misread_as_a_mixed_number(self):
        row=parse_ingredient('1/4-1/2 cup chopped parsley',None)
        self.assertIsNone(row['quantity']);self.assertEqual(row['quantityText'],'1/4-1/2')
        self.assertEqual(row['name'],'Parsley');self.assertEqual(row['unit'],'cup')
    def test_package_count_and_size_are_separate(self):
        row=parse_ingredient('4 15oz cans of kidney beans (or 6 cups cooked beans)',None)
        self.assertEqual(row['quantity'],4);self.assertEqual(row['unit'],'cans')
        self.assertEqual(row['name'],'Kidney beans');self.assertIn('15 oz',row['preparation'])
    def test_unquantified_ingredient_stays_unknown(self):
        row=parse_ingredient('extra virgin olive oil',None)
        self.assertIsNone(row['quantity']);self.assertIsNone(row['quantityText'])
    def test_unicode_mixed_number(self):
        row=parse_ingredient('2½ teaspoons baking powder',None)
        self.assertEqual(row['quantity'],2.5);self.assertEqual(row['name'],'Baking powder')
    def test_compound_measure_is_preserved_without_conversion(self):
        row=parse_ingredient('1 cup + 2 1/2 Tbsp Butter, divided',None)
        self.assertIsNone(row['quantity']);self.assertEqual(row['name'],'Butter')
        self.assertEqual(row['quantityText'],'1 cup + 2 1/2 Tbsp')
    def test_optional_prefix_and_reverse_quantity(self):
        row=parse_ingredient('(optional) ½ tablespoon dill weed',None)
        self.assertTrue(row['optional']);self.assertEqual(row['quantity'],.5)
        row=parse_ingredient('All-purpose flour 3 cups',None)
        self.assertEqual(row['quantity'],3);self.assertEqual(row['name'],'All-purpose flour')

if __name__=='__main__':unittest.main()
