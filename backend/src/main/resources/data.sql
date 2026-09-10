INSERT INTO recipe (name, instructions) VALUES
  ('Garlic Butter Pasta', 'Boil pasta. Saute garlic in butter. Toss together with parmesan and black pepper.'),
  ('Veggie Stir Fry', 'Chop leftover vegetables. Stir fry in oil with soy sauce and ginger over high heat for 5-7 minutes.');

INSERT INTO ingredient (name, quantity, unit, expiration_date) VALUES
  ('Spinach', 1, 'bag', DATEADD('DAY', -1, CURRENT_DATE)),
  ('Chicken Breast', 2, 'lb', CURRENT_DATE),
  ('Greek Yogurt', 1, 'tub', DATEADD('DAY', 2, CURRENT_DATE)),
  ('Bell Peppers', 3, 'each', DATEADD('DAY', 3, CURRENT_DATE));
