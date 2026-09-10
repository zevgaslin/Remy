function RecipeCard({ name, instructions, feedback, onFavorite, onDislike }) {
  return (
    <div className={`recipe-card${feedback === 'favorite' ? ' favorited' : ''}`}>
      <div className="recipe-card-info">
        <h3>{name}</h3>
        <p>{instructions}</p>
      </div>
      <div className="recipe-card-actions">
        <button
          type="button"
          aria-label="Favorite recipe"
          className={feedback === 'favorite' ? 'active' : ''}
          onClick={onFavorite}
        >
          ♥
        </button>
        <button
          type="button"
          aria-label="Dislike recipe"
          className={feedback === 'dislike' ? 'active' : ''}
          onClick={onDislike}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default RecipeCard;
