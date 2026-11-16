import { checkPantryCoverageForRecipeIngredient, formatUnitQuantity } from '../utils/unitConversion';

function RecipeDetails({ recipe, pantryIngredients = [] }) {
  const data = recipe.document || recipe;
  const ingredients = data.ingredients || [];
  const steps = Array.isArray(data.instructions) ? data.instructions : null;
  const sourceUrl = data.source?.url;
  const safeSourceUrl = /^https?:\/\//i.test(sourceUrl || '') ? sourceUrl : null;
  const hasPantry = Array.isArray(pantryIngredients) && pantryIngredients.length > 0;

  return (
    <div className="recipe-details">
      <p className="recipe-metadata">
        {[data.cuisine, data.mealType, data.difficulty,
          data.servings != null ? `${data.servings} servings` : data.yieldText,
          data.prepMinutes != null ? `${data.prepMinutes} min prep` : null,
          data.cookMinutes != null ? `${data.cookMinutes} min cook` : null,
        ].filter(Boolean).join(' · ')}
      </p>
      {data.preferenceTags?.length > 0 && <p className="recipe-tags">
        {Array.from(new Set(data.preferenceTags.map(tag => tag.value))).join(' · ')}
      </p>}
      {ingredients.length > 0 && <>
        <h4>Ingredients</h4>
        <ul>{ingredients.map((ingredient, index) => {
          const coverage = hasPantry ? checkPantryCoverageForRecipeIngredient(ingredient, pantryIngredients) : null;
          const showConvertedBadge = coverage?.matchingPantry?.length > 0 && ingredient.quantity != null;
          return (
            <li key={index}>
              {ingredient.originalText || [ingredient.quantityText ?? ingredient.quantity, ingredient.unit,
                ingredient.name || ingredient.ingredientName].filter(value => value != null && value !== '').join(' ')}
              {!ingredient.originalText && ingredient.preparation ? ` — ${ingredient.preparation}` : ''}
              {ingredient.optional && !/optional/i.test(ingredient.originalText || '') ? ' (optional)' : ''}
              {showConvertedBadge && (
                <span className="recipe-unit-coverage" style={{ marginLeft: '6px', fontSize: '0.8rem', opacity: 0.8 }}>
                  {coverage.covered
                    ? `(In pantry: ${formatUnitQuantity(coverage.haveInRecipeUnit, coverage.neededUnit)})`
                    : `(Have ${formatUnitQuantity(coverage.haveInRecipeUnit, coverage.neededUnit)}, need ${formatUnitQuantity(coverage.remainingInRecipeUnit, coverage.neededUnit)} more)`}
                </span>
              )}
            </li>
          );
        })}</ul>
      </>}
      <h4>Instructions</h4>
      {data.source?.instructionsOrigin === 'adapted' && <p>
        Instructions adapted for Remy. See the source recipe for the original method.
      </p>}
      {steps ? <ol>{steps.map((step, index) => <li key={index}>{step.text}</li>)}</ol>
        : <p className="recipe-instructions">{recipe.instructions}</p>}
      {safeSourceUrl && <p><a href={safeSourceUrl} target="_blank" rel="noreferrer">
        Source: {data.source.siteName || 'Original recipe'}
      </a>{data.source.author ? ` by ${data.source.author}` : ''}</p>}
    </div>
  );
}
export default RecipeDetails;
