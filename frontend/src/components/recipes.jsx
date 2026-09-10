import { useRecipeHover } from '../hooks/useRecipeHover';
import RecipeHoverPopover from './RecipeHoverPopover';

function RecipeCard({ name, instructions, feedback, onFavorite, onDislike }) {
  const { visible, coords, triggerProps } = useRecipeHover();

  return (
    <div
      className={`recipe-card${feedback === 'favorite' ? ' favorited' : ''}`}
      {...triggerProps}
    >
      <div className="recipe-card-info">
        <h3>{name}</h3>
        <p>{instructions}</p>
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
