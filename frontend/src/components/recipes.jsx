function RecipeCard({ name, instructions }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "12px", margin: "8px", borderRadius: "4px" }}>
      <h3 style={{ margin: "0 0 4px 0" }}>{name}</h3>
      <p style={{ margin: 0, color: "#666" }}>{instructions}</p>
    </div>
  );
}

export default RecipeCard;
