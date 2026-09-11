-- Guarded with WHERE NOT EXISTS since the database now persists across
-- restarts (file-based H2) - a plain INSERT would duplicate these rows
-- every time the app starts.

INSERT INTO recipe (name, instructions)
SELECT 'Garlic Butter Pasta', 'Boil pasta. Saute garlic in butter. Toss together with parmesan and black pepper.'
WHERE NOT EXISTS (SELECT 1 FROM recipe WHERE name = 'Garlic Butter Pasta');

INSERT INTO recipe (name, instructions)
SELECT 'Veggie Stir Fry', 'Chop leftover vegetables. Stir fry in oil with soy sauce and ginger over high heat for 5-7 minutes.'
WHERE NOT EXISTS (SELECT 1 FROM recipe WHERE name = 'Veggie Stir Fry');

INSERT INTO ingredient (name, quantity, unit, expiration_date)
SELECT 'Spinach', 1, 'bag', DATEADD('DAY', -1, CURRENT_DATE)
WHERE NOT EXISTS (SELECT 1 FROM ingredient WHERE name = 'Spinach');

INSERT INTO ingredient (name, quantity, unit, expiration_date)
SELECT 'Chicken Breast', 2, 'lb', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM ingredient WHERE name = 'Chicken Breast');

INSERT INTO ingredient (name, quantity, unit, expiration_date)
SELECT 'Greek Yogurt', 1, 'tub', DATEADD('DAY', 2, CURRENT_DATE)
WHERE NOT EXISTS (SELECT 1 FROM ingredient WHERE name = 'Greek Yogurt');

INSERT INTO ingredient (name, quantity, unit, expiration_date)
SELECT 'Bell Peppers', 3, 'each', DATEADD('DAY', 3, CURRENT_DATE)
WHERE NOT EXISTS (SELECT 1 FROM ingredient WHERE name = 'Bell Peppers');
