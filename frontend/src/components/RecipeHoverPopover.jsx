function RecipeHoverPopover({ recipe, coords }) {
  return (
    <div
      className="recipe-hover-popover"
      style={{ top: coords.top, left: coords.left }}
      role="tooltip"
    >
      <h4>{recipe.name}</h4>
      <p>{recipe.instructions}</p>
    </div>
  );
}

export default RecipeHoverPopover;
