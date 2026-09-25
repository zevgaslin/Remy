-- Guarded with WHERE NOT EXISTS since the database now persists across
-- restarts (file-based H2) - a plain INSERT would duplicate these rows
-- every time the app starts.

INSERT INTO users (username, email, password_hash)
SELECT 'remy', 'remy@example.com', '$2a$10$fgTiVsP5u75/qAikGV7zC.kzaVQxlMdvRuI2JKm7ERLCDrFTT3Ooa'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'remy');

INSERT INTO users (username, email, password_hash)
SELECT 'admin', 'admin@example.com', '$2a$10$fgTiVsP5u75/qAikGV7zC.kzaVQxlMdvRuI2JKm7ERLCDrFTT3Ooa'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO recipe (name, description, cuisine, meal_type, difficulty, prep_minutes, cook_minutes, servings, instructions, likes, dislikes)
SELECT 'Garlic Butter Pasta', 'A fast pantry pasta with garlic, butter, parmesan, and black pepper.', 'Italian', 'Dinner', 'Easy', 5, 15, 2, 'Boil pasta. Saute garlic in butter. Toss together with parmesan and black pepper.', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM recipe WHERE name = 'Garlic Butter Pasta');

INSERT INTO recipe (name, description, cuisine, meal_type, difficulty, prep_minutes, cook_minutes, servings, instructions, likes, dislikes)
SELECT 'Veggie Stir Fry Rice Bowl', 'A flexible vegetable rice bowl for using up produce before it expires.', 'Asian-inspired', 'Dinner', 'Easy', 10, 12, 2, 'Cook rice. Stir fry vegetables with ginger and soy sauce over high heat, then serve over rice.', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM recipe WHERE name = 'Veggie Stir Fry Rice Bowl');

INSERT INTO recipe (name, description, cuisine, meal_type, difficulty, prep_minutes, cook_minutes, servings, instructions, likes, dislikes)
SELECT 'Lemon Yogurt Chicken', 'Chicken marinated in Greek yogurt and lemon, then cooked until tender.', 'Mediterranean', 'Dinner', 'Medium', 15, 20, 4, 'Marinate chicken with Greek yogurt, lemon, garlic, olive oil, and black pepper. Cook until the chicken reaches 165 F.', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM recipe WHERE name = 'Lemon Yogurt Chicken');

INSERT INTO recipe (name, description, cuisine, meal_type, difficulty, prep_minutes, cook_minutes, servings, instructions, likes, dislikes)
SELECT 'Spinach Egg Breakfast Wrap', 'A quick breakfast wrap with eggs, spinach, cheddar, and tomato.', 'American', 'Breakfast', 'Easy', 5, 8, 1, 'Scramble eggs with spinach. Add cheddar and tomato, then wrap everything in a warm tortilla.', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM recipe WHERE name = 'Spinach Egg Breakfast Wrap');

INSERT INTO recipe (name, description, cuisine, meal_type, difficulty, prep_minutes, cook_minutes, servings, instructions, likes, dislikes)
SELECT 'Black Bean Sweet Potato Tacos', 'Vegetarian tacos with roasted sweet potato, black beans, cumin, and chili powder.', 'Mexican-inspired', 'Dinner', 'Easy', 10, 25, 3, 'Roast diced sweet potato with olive oil, cumin, and chili powder. Warm black beans and tortillas, then assemble tacos.', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM recipe WHERE name = 'Black Bean Sweet Potato Tacos');

INSERT INTO recipe (name, description, cuisine, meal_type, difficulty, prep_minutes, cook_minutes, servings, instructions, likes, dislikes)
SELECT 'Banana Peanut Butter Oats', 'A filling no-fuss breakfast using oats, milk, banana, and peanut butter.', 'American', 'Breakfast', 'Easy', 5, 5, 1, 'Cook oats with milk. Top with sliced banana and peanut butter.', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM recipe WHERE name = 'Banana Peanut Butter Oats');

INSERT INTO recipe (name, description, cuisine, meal_type, difficulty, prep_minutes, cook_minutes, servings, instructions, likes, dislikes)
SELECT 'Salmon Quinoa Bowl', 'A protein-rich bowl with salmon, quinoa, cucumber, tomato, lemon, and olive oil.', 'Mediterranean', 'Dinner', 'Medium', 10, 18, 2, 'Cook quinoa. Season and cook salmon. Serve with cucumber, tomato, lemon, and olive oil.', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM recipe WHERE name = 'Salmon Quinoa Bowl');

INSERT INTO recipe (name, description, cuisine, meal_type, difficulty, prep_minutes, cook_minutes, servings, instructions, likes, dislikes)
SELECT 'Broccoli Cheddar Rice Skillet', 'A simple comfort-food skillet with rice, broccoli, cheddar, and onion.', 'American', 'Dinner', 'Easy', 10, 20, 3, 'Saute onion, add broccoli and cooked rice, then fold in cheddar until melted.', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM recipe WHERE name = 'Broccoli Cheddar Rice Skillet');

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
SELECT 'Bell Pepper', 3, 'each', DATEADD('DAY', 3, CURRENT_DATE)
WHERE NOT EXISTS (SELECT 1 FROM ingredient WHERE name = 'Bell Pepper');

-- Recipe ingredient and preference values intentionally mirror Recipies.sql.
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, optional)
SELECT r.id, x.ingredient_name, x.quantity, x.unit, x.optional
FROM recipe r
JOIN (VALUES
    ('Garlic Butter Pasta', 'Pasta', 8.0, 'oz', FALSE),
    ('Garlic Butter Pasta', 'Garlic', 3.0, 'cloves', FALSE),
    ('Garlic Butter Pasta', 'Butter', 2.0, 'tbsp', FALSE),
    ('Garlic Butter Pasta', 'Parmesan', 0.5, 'cup', FALSE),
    ('Garlic Butter Pasta', 'Black Pepper', 0.25, 'tsp', TRUE),
    ('Veggie Stir Fry Rice Bowl', 'Rice', 1.0, 'cup', FALSE),
    ('Veggie Stir Fry Rice Bowl', 'Bell Pepper', 1.0, 'each', FALSE),
    ('Veggie Stir Fry Rice Bowl', 'Broccoli', 1.0, 'cup', FALSE),
    ('Veggie Stir Fry Rice Bowl', 'Carrot', 1.0, 'each', TRUE),
    ('Veggie Stir Fry Rice Bowl', 'Soy Sauce', 2.0, 'tbsp', FALSE),
    ('Veggie Stir Fry Rice Bowl', 'Ginger', 1.0, 'tsp', TRUE),
    ('Lemon Yogurt Chicken', 'Chicken Breast', 1.5, 'lb', FALSE),
    ('Lemon Yogurt Chicken', 'Greek Yogurt', 0.75, 'cup', FALSE),
    ('Lemon Yogurt Chicken', 'Lemon', 1.0, 'each', FALSE),
    ('Lemon Yogurt Chicken', 'Garlic', 2.0, 'cloves', FALSE),
    ('Lemon Yogurt Chicken', 'Olive Oil', 1.0, 'tbsp', FALSE),
    ('Spinach Egg Breakfast Wrap', 'Egg', 2.0, 'each', FALSE),
    ('Spinach Egg Breakfast Wrap', 'Spinach', 1.0, 'cup', FALSE),
    ('Spinach Egg Breakfast Wrap', 'Tortilla', 1.0, 'each', FALSE),
    ('Spinach Egg Breakfast Wrap', 'Cheddar', 0.25, 'cup', FALSE),
    ('Spinach Egg Breakfast Wrap', 'Tomato', 0.5, 'each', TRUE),
    ('Black Bean Sweet Potato Tacos', 'Black Beans', 1.0, 'can', FALSE),
    ('Black Bean Sweet Potato Tacos', 'Sweet Potato', 1.0, 'large', FALSE),
    ('Black Bean Sweet Potato Tacos', 'Tortilla', 6.0, 'each', FALSE),
    ('Black Bean Sweet Potato Tacos', 'Olive Oil', 1.0, 'tbsp', FALSE),
    ('Black Bean Sweet Potato Tacos', 'Cumin', 1.0, 'tsp', FALSE),
    ('Black Bean Sweet Potato Tacos', 'Chili Powder', 1.0, 'tsp', FALSE),
    ('Banana Peanut Butter Oats', 'Oats', 0.5, 'cup', FALSE),
    ('Banana Peanut Butter Oats', 'Milk', 1.0, 'cup', FALSE),
    ('Banana Peanut Butter Oats', 'Banana', 1.0, 'each', FALSE),
    ('Banana Peanut Butter Oats', 'Peanut Butter', 2.0, 'tbsp', FALSE),
    ('Salmon Quinoa Bowl', 'Salmon', 2.0, 'fillets', FALSE),
    ('Salmon Quinoa Bowl', 'Quinoa', 1.0, 'cup', FALSE),
    ('Salmon Quinoa Bowl', 'Cucumber', 1.0, 'each', FALSE),
    ('Salmon Quinoa Bowl', 'Tomato', 1.0, 'each', FALSE),
    ('Salmon Quinoa Bowl', 'Lemon', 1.0, 'each', FALSE),
    ('Salmon Quinoa Bowl', 'Olive Oil', 1.0, 'tbsp', FALSE),
    ('Broccoli Cheddar Rice Skillet', 'Rice', 1.0, 'cup', FALSE),
    ('Broccoli Cheddar Rice Skillet', 'Broccoli', 2.0, 'cups', FALSE),
    ('Broccoli Cheddar Rice Skillet', 'Cheddar', 1.0, 'cup', FALSE),
    ('Broccoli Cheddar Rice Skillet', 'Onion', 0.5, 'each', TRUE)
) x(recipe_name, ingredient_name, quantity, unit, optional)
    ON r.name = x.recipe_name
WHERE NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id AND LOWER(ri.ingredient_name) = LOWER(x.ingredient_name)
);

INSERT INTO recipe_preference_tags (recipe_id, preference_name, preference_value)
SELECT r.id, x.preference_name, x.preference_value
FROM recipe r
JOIN (VALUES
    ('Garlic Butter Pasta', 'meal_type', 'dinner'),
    ('Garlic Butter Pasta', 'diet', 'vegetarian'),
    ('Garlic Butter Pasta', 'cuisine', 'italian'),
    ('Garlic Butter Pasta', 'difficulty', 'easy'),
    ('Veggie Stir Fry Rice Bowl', 'meal_type', 'dinner'),
    ('Veggie Stir Fry Rice Bowl', 'diet', 'vegetarian'),
    ('Veggie Stir Fry Rice Bowl', 'diet', 'dairy-free'),
    ('Veggie Stir Fry Rice Bowl', 'cuisine', 'asian-inspired'),
    ('Veggie Stir Fry Rice Bowl', 'difficulty', 'easy'),
    ('Lemon Yogurt Chicken', 'meal_type', 'dinner'),
    ('Lemon Yogurt Chicken', 'diet', 'high-protein'),
    ('Lemon Yogurt Chicken', 'cuisine', 'mediterranean'),
    ('Lemon Yogurt Chicken', 'difficulty', 'medium'),
    ('Spinach Egg Breakfast Wrap', 'meal_type', 'breakfast'),
    ('Spinach Egg Breakfast Wrap', 'diet', 'vegetarian'),
    ('Spinach Egg Breakfast Wrap', 'difficulty', 'easy'),
    ('Black Bean Sweet Potato Tacos', 'meal_type', 'dinner'),
    ('Black Bean Sweet Potato Tacos', 'diet', 'vegetarian'),
    ('Black Bean Sweet Potato Tacos', 'diet', 'high-fiber'),
    ('Black Bean Sweet Potato Tacos', 'cuisine', 'mexican-inspired'),
    ('Black Bean Sweet Potato Tacos', 'difficulty', 'easy'),
    ('Banana Peanut Butter Oats', 'meal_type', 'breakfast'),
    ('Banana Peanut Butter Oats', 'diet', 'vegetarian'),
    ('Banana Peanut Butter Oats', 'difficulty', 'easy'),
    ('Salmon Quinoa Bowl', 'meal_type', 'dinner'),
    ('Salmon Quinoa Bowl', 'diet', 'high-protein'),
    ('Salmon Quinoa Bowl', 'cuisine', 'mediterranean'),
    ('Salmon Quinoa Bowl', 'difficulty', 'medium'),
    ('Broccoli Cheddar Rice Skillet', 'meal_type', 'dinner'),
    ('Broccoli Cheddar Rice Skillet', 'diet', 'vegetarian'),
    ('Broccoli Cheddar Rice Skillet', 'difficulty', 'easy')
) x(recipe_name, preference_name, preference_value)
    ON r.name = x.recipe_name
WHERE NOT EXISTS (
    SELECT 1 FROM recipe_preference_tags rpt
    WHERE rpt.recipe_id = r.id
      AND LOWER(rpt.preference_name) = LOWER(x.preference_name)
      AND LOWER(rpt.preference_value) = LOWER(x.preference_value)
);
