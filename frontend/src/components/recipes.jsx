import { useRecipeHover } from '../hooks/useRecipeHover';
import RecipeHoverPopover from './RecipeHoverPopover';

function RecipeCard({
  name,
  instructions,
  matchScore,
  matchedIngredients = [],
  missingIngredients = [],
  feedback,
  onFavorite,
  onDislike,
}) {
  const { visible, coords, triggerProps } = useRecipeHover();

  return (
    <div
      className={`recipe-card${feedback === 'favorite' ? ' favorited' : ''}`}
      {...triggerProps}
    >
      <div className="recipe-card-info">
        <div className="recipe-card-title-row">
          <h3>{name}</h3>
          {matchScore !== undefined && (
            <span className="recipe-match-score">{Math.round(matchScore)}% match</span>
          )}
        </div>
        <p>{instructions}</p>
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
          className={feedback === 'dislike' ? 'active' : ''}
          onClick={(event) => {
            event.stopPropagation();
            onDislike();
          }}
        >
          ✕
        </button>
      </div>
      {visible && <RecipeHoverPopover recipe={{ name, instructions }} coords={coords} />}
    </div>
  );
}

export default RecipeCard;
