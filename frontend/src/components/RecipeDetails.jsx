function RecipeDetails({ recipe }) {
  const data = recipe.document || recipe;
  const ingredients = data.ingredients || [];
  const steps = Array.isArray(data.instructions) ? data.instructions : null;
  const sourceUrl = data.source?.url;
  const safeSourceUrl = /^https?:\/\//i.test(sourceUrl || '') ? sourceUrl : null;
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
        <ul>{ingredients.map((ingredient, index) => (
          <li key={index}>
            {[ingredient.quantityText ?? ingredient.quantity, ingredient.unit,
              ingredient.name || ingredient.ingredientName].filter(value => value != null && value !== '').join(' ')}
            {ingredient.preparation ? ` — ${ingredient.preparation}` : ''}
            {ingredient.optional ? ' (optional)' : ''}
          </li>
        ))}</ul>
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
