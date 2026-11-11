// Match dish types before ingredients: chicken salad is a salad, not a drumstick.
// Paths refer to unmodified, locally bundled OpenMoji artwork (see public/illustrations/LICENSE.txt).
const DISH_RULES = [
  [/\b(tacos?|tostadas?)\b/, 'taco', 'Taco'],
  [/\b(burritos?|wraps?|quesadillas?)\b/, 'wrap', 'Wrap'],
  [/\bpizzas?\b/, 'pizza', 'Pizza'],
  [/\b(burgers?|hamburgers?|cheeseburgers?)\b/, 'burger', 'Burger'],
  [/\b(sandwich(?:es)?|panini|toasties?|subs?)\b/, 'sandwich', 'Sandwich'],
  [/\b(soups?|stews?|chowders?|chili|chilli|broth|bouillon|consomme|congee)\b/, 'soup', 'Soup'],
  [/\b(salads?|slaw|coleslaw)\b/, 'salad', 'Salad'],
  [/\b(pancakes?|hotcakes?|flapjacks?)\b/, 'pancakes', 'Pancake'],
  [/\bwaffles?\b/, 'waffle', 'Waffle'],
  [/\b(cookies?|biscuits?|shortbread)\b/, 'cookie', 'Cookie'],
  [/\b(doughnuts?|donuts?)\b/, 'doughnut', 'Doughnut'],
  [/\b(ice cream|gelato|sorbet)\b/, 'ice-cream', 'Ice cream'],
  [/\b(puddings?|custards?|flan|mousse|blanc ?mange)\b/, 'custard', 'Custard'],
  [/\b(cakes?|cupcakes?|cheesecakes?|brownies?|fruitcake|shortcakes?|muffins?|sponge)\b/, 'cake', 'Cake'],
  [/\b(pies?|tarts?|cobblers?|quiches?)\b/, 'pie', 'Pie'],
  [/\b(croissants?|crescent rolls?)\b/, 'croissant', 'Croissant'],
  [/\b(bread|gingerbread|loaf|loaves|toast|crumpets?|rolls?|buns?)\b/, 'bread', 'Bread'],
  [/\b(dumplings?|potstickers?|gyoza|pierogi)\b/, 'dumpling', 'Dumpling'],
  [/\bsushi\b/, 'sushi', 'Sushi'],
  [/\b(pasta|spaghetti|linguine|fettuccine|penne|rigatoni|lasagn[ae]|macaroni|mac and cheese|mac n cheese|orzo|ravioli|gnocchi)\b/, 'pasta', 'Pasta'],
  [/\b(noodles?|ramen|udon|soba|pho|knofli|spaetzle)\b/, 'noodles', 'Noodle bowl'],
  [/\b(rice|risotto|quinoa|grain bowl)\b/, 'rice', 'Rice bowl'],
  [/\b(oats?|oatmeal|porridge|cereal|granola)\b/, 'bowl', 'Breakfast bowl'],
  [/\b(eggs?|omelet(?:te)?s?|frittatas?|scramble)\b/, 'egg', 'Egg'],
  [/\b(chicken|turkey|duck|poultry)\b/, 'chicken', 'Poultry'],
  [/\b(salmon|tuna|fish|cod|trout|tilapia|haddock|mackerel|sardines?)\b/, 'fish', 'Fish'],
  [/\b(shrimps?|prawns?)\b/, 'shrimp', 'Shrimp'],
  [/\b(beef|steaks?|pork|lamb|mutton|veal|venison|meatballs?|roast)\b/, 'meat', 'Meat'],
  [/\b(yogurt|yoghurt)\b/, 'bowl', 'Breakfast bowl'],
  [/\b(potatoes|potato)\b/, 'potato', 'Potato'],
  [/\bbroccoli\b/, 'broccoli', 'Broccoli'],
  [/\b(mushrooms?|champignons?)\b/, 'mushroom', 'Mushroom'],
  [/\b(tomatoes|tomato)\b/, 'tomato', 'Tomato'],
  [/\b(vegetables?|veggies?|greens?|spinach|zucchini|aubergine|eggplant)\b/, 'salad', 'Vegetable'],
  [/\b(coffee|espresso|cappuccino)\b/, 'coffee', 'Coffee'],
  [/\btea\b/, 'tea', 'Tea'],
  [/\b(wine|sangria|mulled)\b/, 'wine', 'Wine'],
  [/\b(juice|punch|lemonade|smoothie)\b/, 'juice', 'Drink'],
  [/\b(candy|toffee|caramels?|fudge)\b/, 'candy', 'Candy'],
  [/\bchocolate\b/, 'chocolate', 'Chocolate'],
  [/\b(strawberry|strawberries|berries|berry|raspberries|raspberry)\b/, 'strawberry', 'Berry'],
  [/\b(pears?|apples?)\b/, 'apple', 'Fruit'],
  [/\b(bananas?|plantains?)\b/, 'banana', 'Banana'],
  [/\b(peaches|peach|apricots?|plums?|prunes?)\b/, 'peach', 'Fruit'],
  [/\b(lemons?|oranges?|citrus)\b/, 'lemon', 'Citrus'],
  [/\b(cheese|rarebit)\b/, 'cheese', 'Cheese'],
  [/\b(milk|cream)\b/, 'milk', 'Milk'],
];

export function getRecipeIllustration(name = '') {
  const normalized = String(name ?? '').normalize('NFKD').replace(/\p{M}/gu, '')
    .toLowerCase().replace(/[-–—&]/g, ' ').replace(/\s+/g, ' ').trim();
  const match = DISH_RULES.find(([pattern]) => pattern.test(normalized));
  const [, asset, label] = match || [null, 'plate', 'Dish'];
  return { src: `/illustrations/${asset}.svg`, alt: `${label} illustration` };
}
