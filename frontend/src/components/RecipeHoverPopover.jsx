import RecipeIllustration from './RecipeIllustration';

function RecipeHoverPopover({ recipe, coords }) {
  return (
    <div
      className="recipe-hover-popover"
      style={{ top: coords.top, left: coords.left }}
      role="tooltip"
    >
      <RecipeIllustration name={recipe.name || recipe.document?.name} size={48} />
      <h4>{recipe.name}</h4>
      <p className="recipe-instructions">{recipe.instructions}</p>
    </div>
  );
}

export default RecipeHoverPopover;
