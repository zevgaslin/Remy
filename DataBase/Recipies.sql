CREATE DATABASE IF NOT EXISTS remy_db;

USE remy_db;

-- Recipe data designed to match against the tables in remy_schema.sql:
--   user_ingredients -> ingredients -> recipe_ingredients
--   user_preferences -> recipe_preference_tags

CREATE TABLE IF NOT EXISTS recipes (
    recipe_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description VARCHAR(500),
    cuisine VARCHAR(100),
    meal_type VARCHAR(100),
    difficulty VARCHAR(50),
    prep_minutes INT,
    cook_minutes INT,
    servings INT,
    instructions TEXT
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipe_ingredient_id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    is_optional BOOLEAN DEFAULT FALSE,

    UNIQUE KEY uq_recipe_ingredient (recipe_id, ingredient_id),

    FOREIGN KEY (recipe_id)
        REFERENCES recipes(recipe_id)
        ON DELETE CASCADE,

    FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(ingredient_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipe_preference_tags (
    recipe_preference_tag_id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    preference_name VARCHAR(100) NOT NULL,
    preference_value VARCHAR(255) NOT NULL,

    UNIQUE KEY uq_recipe_preference_tag (recipe_id, preference_name, preference_value),

    FOREIGN KEY (recipe_id)
        REFERENCES recipes(recipe_id)
        ON DELETE CASCADE
);

INSERT INTO ingredients (name, category) VALUES
    ('Pasta', 'Grain'),
    ('Garlic', 'Produce'),
    ('Butter', 'Dairy'),
    ('Parmesan', 'Dairy'),
    ('Black Pepper', 'Spice'),
    ('Spinach', 'Produce'),
    ('Bell Pepper', 'Produce'),
    ('Broccoli', 'Produce'),
    ('Carrot', 'Produce'),
    ('Soy Sauce', 'Condiment'),
    ('Ginger', 'Produce'),
    ('Rice', 'Grain'),
    ('Chicken Breast', 'Meat'),
    ('Greek Yogurt', 'Dairy'),
    ('Lemon', 'Produce'),
    ('Cucumber', 'Produce'),
    ('Tomato', 'Produce'),
    ('Egg', 'Protein'),
    ('Tortilla', 'Grain'),
    ('Cheddar', 'Dairy'),
    ('Black Beans', 'Legume'),
    ('Sweet Potato', 'Produce'),
    ('Olive Oil', 'Oil'),
    ('Onion', 'Produce'),
    ('Cumin', 'Spice'),
    ('Chili Powder', 'Spice'),
    ('Oats', 'Grain'),
    ('Milk', 'Dairy'),
    ('Banana', 'Produce'),
    ('Peanut Butter', 'Pantry'),
    ('Salmon', 'Seafood'),
    ('Quinoa', 'Grain')
ON DUPLICATE KEY UPDATE category = VALUES(category);

INSERT INTO recipes (
    name,
    description,
    cuisine,
    meal_type,
    difficulty,
    prep_minutes,
    cook_minutes,
    servings,
    instructions
) VALUES
    (
        'Garlic Butter Pasta',
        'A fast pantry pasta with garlic, butter, parmesan, and black pepper.',
        'Italian',
        'Dinner',
        'Easy',
        5,
        15,
        2,
        'Boil pasta until al dente. Saute garlic in butter, then toss with pasta, parmesan, black pepper, and a splash of pasta water.'
    ),
    (
        'Veggie Stir Fry Rice Bowl',
        'A flexible vegetable rice bowl for using up produce before it expires.',
        'Asian-inspired',
        'Dinner',
        'Easy',
        10,
        12,
        2,
        'Cook rice. Stir fry vegetables with ginger and soy sauce over high heat, then serve over rice.'
    ),
    (
        'Lemon Yogurt Chicken',
        'Chicken marinated in Greek yogurt and lemon, then cooked until tender.',
        'Mediterranean',
        'Dinner',
        'Medium',
        15,
        20,
        4,
        'Marinate chicken with Greek yogurt, lemon, garlic, olive oil, and black pepper. Cook in a skillet or oven until the chicken reaches 165 F.'
    ),
    (
        'Spinach Egg Breakfast Wrap',
        'A quick breakfast wrap with eggs, spinach, cheddar, and tomato.',
        'American',
        'Breakfast',
        'Easy',
        5,
        8,
        1,
        'Scramble eggs with spinach. Add cheddar and tomato, then wrap everything in a warm tortilla.'
    ),
    (
        'Black Bean Sweet Potato Tacos',
        'Vegetarian tacos with roasted sweet potato, black beans, cumin, and chili powder.',
        'Mexican-inspired',
        'Dinner',
        'Easy',
        10,
        25,
        3,
        'Roast diced sweet potato with olive oil, cumin, and chili powder. Warm black beans and tortillas, then assemble tacos.'
    ),
    (
        'Banana Peanut Butter Oats',
        'A filling no-fuss breakfast using oats, milk, banana, and peanut butter.',
        'American',
        'Breakfast',
        'Easy',
        5,
        5,
        1,
        'Cook oats with milk. Top with sliced banana and peanut butter.'
    ),
    (
        'Salmon Quinoa Bowl',
        'A protein-rich bowl with salmon, quinoa, cucumber, tomato, lemon, and olive oil.',
        'Mediterranean',
        'Dinner',
        'Medium',
        10,
        18,
        2,
        'Cook quinoa. Season and cook salmon. Serve with cucumber, tomato, lemon, and olive oil.'
    ),
    (
        'Broccoli Cheddar Rice Skillet',
        'A simple comfort-food skillet with rice, broccoli, cheddar, and onion.',
        'American',
        'Dinner',
        'Easy',
        10,
        20,
        3,
        'Saute onion, add broccoli and cooked rice, then fold in cheddar until melted.'
    )
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    cuisine = VALUES(cuisine),
    meal_type = VALUES(meal_type),
    difficulty = VALUES(difficulty),
    prep_minutes = VALUES(prep_minutes),
    cook_minutes = VALUES(cook_minutes),
    servings = VALUES(servings),
    instructions = VALUES(instructions);

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit, is_optional)
SELECT r.recipe_id, i.ingredient_id, x.quantity, x.unit, x.is_optional
FROM (
    SELECT 'Garlic Butter Pasta' AS recipe_name, 'Pasta' AS ingredient_name, 8.00 AS quantity, 'oz' AS unit, FALSE AS is_optional
    UNION ALL SELECT 'Garlic Butter Pasta', 'Garlic', 3.00, 'cloves', FALSE
    UNION ALL SELECT 'Garlic Butter Pasta', 'Butter', 2.00, 'tbsp', FALSE
    UNION ALL SELECT 'Garlic Butter Pasta', 'Parmesan', 0.50, 'cup', FALSE
    UNION ALL SELECT 'Garlic Butter Pasta', 'Black Pepper', 0.25, 'tsp', TRUE

    UNION ALL SELECT 'Veggie Stir Fry Rice Bowl', 'Rice', 1.00, 'cup', FALSE
    UNION ALL SELECT 'Veggie Stir Fry Rice Bowl', 'Bell Pepper', 1.00, 'each', FALSE
    UNION ALL SELECT 'Veggie Stir Fry Rice Bowl', 'Broccoli', 1.00, 'cup', FALSE
    UNION ALL SELECT 'Veggie Stir Fry Rice Bowl', 'Carrot', 1.00, 'each', TRUE
    UNION ALL SELECT 'Veggie Stir Fry Rice Bowl', 'Soy Sauce', 2.00, 'tbsp', FALSE
    UNION ALL SELECT 'Veggie Stir Fry Rice Bowl', 'Ginger', 1.00, 'tsp', TRUE

    UNION ALL SELECT 'Lemon Yogurt Chicken', 'Chicken Breast', 1.50, 'lb', FALSE
    UNION ALL SELECT 'Lemon Yogurt Chicken', 'Greek Yogurt', 0.75, 'cup', FALSE
    UNION ALL SELECT 'Lemon Yogurt Chicken', 'Lemon', 1.00, 'each', FALSE
    UNION ALL SELECT 'Lemon Yogurt Chicken', 'Garlic', 2.00, 'cloves', FALSE
    UNION ALL SELECT 'Lemon Yogurt Chicken', 'Olive Oil', 1.00, 'tbsp', FALSE
    UNION ALL SELECT 'Lemon Yogurt Chicken', 'Black Pepper', 0.25, 'tsp', TRUE

    UNION ALL SELECT 'Spinach Egg Breakfast Wrap', 'Egg', 2.00, 'each', FALSE
    UNION ALL SELECT 'Spinach Egg Breakfast Wrap', 'Spinach', 1.00, 'cup', FALSE
    UNION ALL SELECT 'Spinach Egg Breakfast Wrap', 'Tortilla', 1.00, 'each', FALSE
    UNION ALL SELECT 'Spinach Egg Breakfast Wrap', 'Cheddar', 0.25, 'cup', FALSE
    UNION ALL SELECT 'Spinach Egg Breakfast Wrap', 'Tomato', 0.50, 'each', TRUE

    UNION ALL SELECT 'Black Bean Sweet Potato Tacos', 'Black Beans', 1.00, 'can', FALSE
    UNION ALL SELECT 'Black Bean Sweet Potato Tacos', 'Sweet Potato', 1.00, 'large', FALSE
    UNION ALL SELECT 'Black Bean Sweet Potato Tacos', 'Tortilla', 6.00, 'each', FALSE
    UNION ALL SELECT 'Black Bean Sweet Potato Tacos', 'Olive Oil', 1.00, 'tbsp', FALSE
    UNION ALL SELECT 'Black Bean Sweet Potato Tacos', 'Cumin', 1.00, 'tsp', FALSE
    UNION ALL SELECT 'Black Bean Sweet Potato Tacos', 'Chili Powder', 1.00, 'tsp', FALSE

    UNION ALL SELECT 'Banana Peanut Butter Oats', 'Oats', 0.50, 'cup', FALSE
    UNION ALL SELECT 'Banana Peanut Butter Oats', 'Milk', 1.00, 'cup', FALSE
    UNION ALL SELECT 'Banana Peanut Butter Oats', 'Banana', 1.00, 'each', FALSE
    UNION ALL SELECT 'Banana Peanut Butter Oats', 'Peanut Butter', 2.00, 'tbsp', FALSE

    UNION ALL SELECT 'Salmon Quinoa Bowl', 'Salmon', 2.00, 'fillets', FALSE
    UNION ALL SELECT 'Salmon Quinoa Bowl', 'Quinoa', 1.00, 'cup', FALSE
    UNION ALL SELECT 'Salmon Quinoa Bowl', 'Cucumber', 1.00, 'each', FALSE
    UNION ALL SELECT 'Salmon Quinoa Bowl', 'Tomato', 1.00, 'each', FALSE
    UNION ALL SELECT 'Salmon Quinoa Bowl', 'Lemon', 1.00, 'each', FALSE
    UNION ALL SELECT 'Salmon Quinoa Bowl', 'Olive Oil', 1.00, 'tbsp', FALSE

    UNION ALL SELECT 'Broccoli Cheddar Rice Skillet', 'Rice', 1.00, 'cup', FALSE
    UNION ALL SELECT 'Broccoli Cheddar Rice Skillet', 'Broccoli', 2.00, 'cups', FALSE
    UNION ALL SELECT 'Broccoli Cheddar Rice Skillet', 'Cheddar', 1.00, 'cup', FALSE
    UNION ALL SELECT 'Broccoli Cheddar Rice Skillet', 'Onion', 0.50, 'each', TRUE
) AS x
JOIN recipes r ON r.name = x.recipe_name
JOIN ingredients i ON i.name = x.ingredient_name
ON DUPLICATE KEY UPDATE
    quantity = VALUES(quantity),
    unit = VALUES(unit),
    is_optional = VALUES(is_optional);

INSERT INTO recipe_preference_tags (recipe_id, preference_name, preference_value)
SELECT r.recipe_id, x.preference_name, x.preference_value
FROM (
    SELECT 'Garlic Butter Pasta' AS recipe_name, 'meal_type' AS preference_name, 'dinner' AS preference_value
    UNION ALL SELECT 'Garlic Butter Pasta', 'diet', 'vegetarian'
    UNION ALL SELECT 'Garlic Butter Pasta', 'cuisine', 'italian'
    UNION ALL SELECT 'Garlic Butter Pasta', 'difficulty', 'easy'

    UNION ALL SELECT 'Veggie Stir Fry Rice Bowl', 'meal_type', 'dinner'
    UNION ALL SELECT 'Veggie Stir Fry Rice Bowl', 'diet', 'vegetarian'
    UNION ALL SELECT 'Veggie Stir Fry Rice Bowl', 'diet', 'dairy-free'
    UNION ALL SELECT 'Veggie Stir Fry Rice Bowl', 'cuisine', 'asian-inspired'
    UNION ALL SELECT 'Veggie Stir Fry Rice Bowl', 'difficulty', 'easy'

    UNION ALL SELECT 'Lemon Yogurt Chicken', 'meal_type', 'dinner'
    UNION ALL SELECT 'Lemon Yogurt Chicken', 'diet', 'high-protein'
    UNION ALL SELECT 'Lemon Yogurt Chicken', 'cuisine', 'mediterranean'
    UNION ALL SELECT 'Lemon Yogurt Chicken', 'difficulty', 'medium'

    UNION ALL SELECT 'Spinach Egg Breakfast Wrap', 'meal_type', 'breakfast'
    UNION ALL SELECT 'Spinach Egg Breakfast Wrap', 'diet', 'vegetarian'
    UNION ALL SELECT 'Spinach Egg Breakfast Wrap', 'difficulty', 'easy'

    UNION ALL SELECT 'Black Bean Sweet Potato Tacos', 'meal_type', 'dinner'
    UNION ALL SELECT 'Black Bean Sweet Potato Tacos', 'diet', 'vegetarian'
    UNION ALL SELECT 'Black Bean Sweet Potato Tacos', 'diet', 'high-fiber'
    UNION ALL SELECT 'Black Bean Sweet Potato Tacos', 'cuisine', 'mexican-inspired'
    UNION ALL SELECT 'Black Bean Sweet Potato Tacos', 'difficulty', 'easy'

    UNION ALL SELECT 'Banana Peanut Butter Oats', 'meal_type', 'breakfast'
    UNION ALL SELECT 'Banana Peanut Butter Oats', 'diet', 'vegetarian'
    UNION ALL SELECT 'Banana Peanut Butter Oats', 'difficulty', 'easy'

    UNION ALL SELECT 'Salmon Quinoa Bowl', 'meal_type', 'dinner'
    UNION ALL SELECT 'Salmon Quinoa Bowl', 'diet', 'high-protein'
    UNION ALL SELECT 'Salmon Quinoa Bowl', 'cuisine', 'mediterranean'
    UNION ALL SELECT 'Salmon Quinoa Bowl', 'difficulty', 'medium'

    UNION ALL SELECT 'Broccoli Cheddar Rice Skillet', 'meal_type', 'dinner'
    UNION ALL SELECT 'Broccoli Cheddar Rice Skillet', 'diet', 'vegetarian'
    UNION ALL SELECT 'Broccoli Cheddar Rice Skillet', 'difficulty', 'easy'
) AS x
JOIN recipes r ON r.name = x.recipe_name
ON DUPLICATE KEY UPDATE
    preference_value = VALUES(preference_value);

CREATE OR REPLACE VIEW user_recipe_ingredient_matches AS
SELECT
    u.user_id,
    r.recipe_id,
    r.name AS recipe_name,
    SUM(CASE WHEN ri.is_optional = FALSE THEN 1 ELSE 0 END) AS required_ingredient_count,
    COUNT(DISTINCT CASE
        WHEN ri.is_optional = FALSE AND ui.user_ingredient_id IS NOT NULL THEN ri.ingredient_id
    END) AS matched_required_ingredient_count,
    COUNT(DISTINCT CASE
        WHEN ri.is_optional = TRUE AND ui.user_ingredient_id IS NOT NULL THEN ri.ingredient_id
    END) AS matched_optional_ingredient_count
FROM users u
CROSS JOIN recipes r
JOIN recipe_ingredients ri
    ON ri.recipe_id = r.recipe_id
LEFT JOIN user_ingredients ui
    ON ui.user_id = u.user_id
    AND ui.ingredient_id = ri.ingredient_id
GROUP BY
    u.user_id,
    r.recipe_id,
    r.name;

CREATE OR REPLACE VIEW user_recipe_preference_matches AS
SELECT
    u.user_id,
    r.recipe_id,
    r.name AS recipe_name,
    COUNT(DISTINCT rpt.recipe_preference_tag_id) AS recipe_preference_count,
    COUNT(DISTINCT CASE
        WHEN up.preference_id IS NOT NULL THEN rpt.recipe_preference_tag_id
    END) AS matched_preference_count
FROM users u
CROSS JOIN recipes r
LEFT JOIN recipe_preference_tags rpt
    ON rpt.recipe_id = r.recipe_id
LEFT JOIN user_preferences up
    ON up.user_id = u.user_id
    AND LOWER(up.preference_name) = LOWER(rpt.preference_name)
    AND LOWER(up.preference_value) = LOWER(rpt.preference_value)
GROUP BY
    u.user_id,
    r.recipe_id,
    r.name;

CREATE OR REPLACE VIEW user_recipe_matches AS
SELECT
    im.user_id,
    im.recipe_id,
    im.recipe_name,
    im.required_ingredient_count,
    im.matched_required_ingredient_count,
    im.matched_optional_ingredient_count,
    pm.recipe_preference_count,
    pm.matched_preference_count,
    ROUND(
        (
            (im.matched_required_ingredient_count / NULLIF(im.required_ingredient_count, 0)) * 0.75
            + (pm.matched_preference_count / NULLIF(pm.recipe_preference_count, 0)) * 0.25
        ) * 100,
        2
    ) AS match_score
FROM user_recipe_ingredient_matches im
JOIN user_recipe_preference_matches pm
    ON pm.user_id = im.user_id
    AND pm.recipe_id = im.recipe_id;
