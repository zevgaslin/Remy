import RecipeDetails from './RecipeDetails';
import StarRating from './StarRating';

function RecipeCard({
  name,
  instructions,
  recipe = {},
  matchScore,
  matchedIngredients = [],
  missingIngredients = [],
  expiringIngredients = [],
  feedback,
  rating = null,
  onFavorite,
  onDislike,
  onRate,
}) {
  return (
    <div
      className={`recipe-card${feedback === 'favorite' ? ' favorited' : ''}`}
    >
      <div className="recipe-card-info">
        <div className="recipe-card-title-row">
          <h3>{name}</h3>
          {matchScore != null && (
            <span className="recipe-match-score">{Math.round(matchScore)}% match</span>
          )}
        </div>
        <p>{recipe.description || recipe.document?.description || instructions}</p>
        {onRate && (
          <StarRating
            value={rating}
            average={recipe.ratingAverage ?? null}
            count={recipe.ratingCount ?? 0}
            onRate={onRate}
          />
        )}
        {recipe.usageCount > 0 && (
          <p className="recipe-match-detail">
            Planned or cooked by {recipe.usageCount} {recipe.usageCount === 1 ? 'person' : 'people'}
          </p>
        )}
        <details className="recipe-expand">
          <summary>View recipe</summary>
          <RecipeDetails recipe={{ ...recipe, name, instructions }} />
        </details>
        {expiringIngredients.length > 0 && (
          <p className="recipe-expiring-detail">
            Uses up: {expiringIngredients.join(', ')}
          </p>
        )}
        {matchedIngredients.length > 0 && (
          <p className="recipe-match-detail">
            Have: {matchedIngredients.join(', ')}
          </p>
        )}
        {missingIngredients.length > 0 && (
          <p className="recipe-missing-detail">
            Need: {missingIngredients.join(', ')}
          </p>
        )}
      </div>
      <div className="recipe-card-actions">
        <button
          type="button"
          aria-label="Favorite recipe"
          aria-pressed={feedback === 'favorite'}
          className={feedback === 'favorite' ? 'active' : ''}
          onClick={(event) => {
            event.stopPropagation();
            onFavorite();
          }}
        >
          ♥
        </button>
        <button
          type="button"
          aria-label="Dislike recipe"
          aria-pressed={feedback === 'dislike'}
          className={feedback === 'dislike' ? 'active' : ''}
          onClick={(event) => {
            event.stopPropagation();
            onDislike();
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default RecipeCard;
