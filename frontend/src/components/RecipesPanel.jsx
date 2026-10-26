import { useEffect, useState } from 'react';
import RecipeCard from './recipes';
import { useRecipes } from '../hooks/useRecipes';

const DIET_OPTIONS = [
  { value: '', label: 'Any diet' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'dairy-free', label: 'Dairy-free' },
  { value: 'high-protein', label: 'High protein' },
  { value: 'high-fiber', label: 'High fiber' },
];

const INITIAL_RECIPE_STATE = {
  name: '',
  description: '',
  cuisine: '',
  mealType: '',
  difficulty: '',
  prepMinutes: '',
  cookMinutes: '',
  totalMinutes: '',
  servings: '',
  yieldText: '',
  imageUrl: '',
  ingredients: [{ name: '', originalText: '', quantity: '', quantityText: '', unit: '', preparation: '', section: '', optional: false }],
  instructions: [{ text: '', section: '' }],
  preferenceTags: [{ name: '', value: '' }],
  keywords: [''],
  nutrition: { basis: 'per-serving', estimated: true, calories: '', protein: '', carbs: '', fat: '' },
  source: { kind: 'manual', url: '', siteName: '', author: '', originalInstructions: '' }
};

function RecipesPanel({ currentUser }) {
  const {
    recipes, feedback, loading, error, searchActive, showingFavorites,
    search, refresh, showFavorites, setRecipeFeedback, addNewRecipe,
  } = useRecipes(currentUser);
  
  // Search state
  const [recipeQuery, setRecipeQuery] = useState('');
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [diet, setDiet] = useState('');
  const [onlyCurrentIngredients, setOnlyCurrentIngredients] = useState(false);
  const [onlyMakeNow, setOnlyMakeNow] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [recipeForm, setRecipeForm] = useState(INITIAL_RECIPE_STATE);

  function resetFilters() {
    setRecipeQuery('');
    setIngredientQuery('');
    setDiet('');
    setOnlyCurrentIngredients(false);
    setOnlyMakeNow(false);
  }

  useEffect(() => { resetFilters(); }, [currentUser?.token]);

  function handleSearch(event) {
    event.preventDefault();
    search({
      query: recipeQuery,
      ingredients: ingredientQuery.split(',').map(value => value.trim()).filter(Boolean),
      preferences: diet ? [{ name: 'diet', value: diet }] : [],
      requireAllIngredients: onlyMakeNow,
      useCurrentIngredients: onlyCurrentIngredients,
    });
  }

  function handleRandomRecipe() {
    search({
      random: true, 
      preferences: diet ? [{ name: 'diet', value: diet }] : [],
      query: '',
      ingredients: [],
      requireAllIngredients: false,
      useCurrentIngredients: false,
    });
  }

  function refreshFeed() {
    resetFilters();
    return refresh();
  }

  // Form Handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setRecipeForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (group, field, value) => {
    setRecipeForm(prev => ({
      ...prev,
      [group]: { ...prev[group], [field]: value }
    }));
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    const newArray = [...recipeForm[arrayName]];
    if (field === null) {
      newArray[index] = value;
    } else {
      newArray[index][field] = value;
    }
    setRecipeForm(prev => ({ ...prev, [arrayName]: newArray }));
  };

  const addArrayItem = (arrayName, emptyItem) => {
    setRecipeForm(prev => ({ ...prev, [arrayName]: [...prev[arrayName], emptyItem] }));
  };

  const removeArrayItem = (arrayName, index) => {
    setRecipeForm(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const cleanString = (str) => str && str.trim() ? str.trim() : null;
  const cleanNumber = (num) => num !== '' && !isNaN(num) ? Number(num) : null;

  async function handleAddSubmit(event) {
    event.preventDefault();

    const payload = {
      schemaVersion: 1,
      id: crypto.randomUUID(), 
      name: recipeForm.name.trim(),
      description: cleanString(recipeForm.description),
      cuisine: cleanString(recipeForm.cuisine),
      mealType: cleanString(recipeForm.mealType),
      difficulty: cleanString(recipeForm.difficulty),
      prepMinutes: cleanNumber(recipeForm.prepMinutes),
      cookMinutes: cleanNumber(recipeForm.cookMinutes),
      totalMinutes: cleanNumber(recipeForm.totalMinutes),
      servings: cleanNumber(recipeForm.servings),
      yieldText: cleanString(recipeForm.yieldText),
      imageUrl: cleanString(recipeForm.imageUrl),
      
      ingredients: recipeForm.ingredients.map(ing => ({
        name: ing.name.trim(),
        originalText: cleanString(ing.originalText),
        quantity: cleanNumber(ing.quantity),
        quantityText: cleanString(ing.quantityText),
        unit: cleanString(ing.unit),
        preparation: cleanString(ing.preparation),
        section: cleanString(ing.section),
        optional: ing.optional
      })),

      instructions: recipeForm.instructions.map(inst => ({
        text: inst.text.trim(),
        section: cleanString(inst.section)
      })),

      preferenceTags: recipeForm.preferenceTags
        .filter(tag => tag.name.trim() && tag.value.trim())
        .map(tag => ({
          name: tag.name.trim(),
          value: tag.value.trim()
        })),

      keywords: recipeForm.keywords.map(kw => kw.trim()).filter(Boolean),

      nutrition: {
        basis: "per-serving",
        estimated: recipeForm.nutrition.estimated,
        calories: cleanNumber(recipeForm.nutrition.calories),
        protein: cleanNumber(recipeForm.nutrition.protein),
        carbs: cleanNumber(recipeForm.nutrition.carbs),
        fat: cleanNumber(recipeForm.nutrition.fat)
      },

      source: {
        kind: recipeForm.source.kind,
        url: cleanString(recipeForm.source.url),
        siteName: cleanString(recipeForm.source.siteName),
        author: cleanString(recipeForm.source.author),
        importedAt: new Date().toISOString(),
        originalInstructions: cleanString(recipeForm.source.originalInstructions) || recipeForm.instructions.map(i => i.text).join('\n')
      }
    };

    const success = await addNewRecipe(payload);
    if (success) {
      setShowAddModal(false);
      setRecipeForm(INITIAL_RECIPE_STATE);
    }
  }

  return (
    <section className="recipes-panel">
      <div className="recipes-panel-header">
        <div>
          <h2>{searchActive ? 'Recipe Search' : showingFavorites ? 'My Favorites' : 'Recipes For You'}</h2>
          {searchActive && !loading && (
            <span className="recipe-result-count">
              {recipes.length} {recipes.length === 1 ? 'match' : 'matches'}
            </span>
          )}
          {showingFavorites && !loading && (
            <span className="recipe-result-count">
              {recipes.length} {recipes.length === 1 ? 'favorite' : 'favorites'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="auth-button" onClick={() => setShowAddModal(true)} disabled={loading}>
            + Add Recipe
          </button>
          {currentUser && (
            <button type="button" className="auth-button" onClick={showFavorites} disabled={loading}>
              ♥ Favorites
            </button>
          )}
          <button type="button" className="auth-button" onClick={refreshFeed} disabled={loading}>
            Refresh feed
          </button>
        </div>
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', 
          justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, overflowY: 'auto', padding: '2rem 0'
        }}>
          <div style={{
            background: '#fff', padding: '2rem', borderRadius: '8px', 
            width: '90%', maxWidth: '800px', color: '#000', marginBottom: '2rem'
          }}>
            <h2 style={{ marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>Add Comprehensive Recipe</h2>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <fieldset style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
                <legend style={{ fontWeight: 'bold' }}>Basic Details</legend>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ flex: 1 }}>Name *<input type="text" name="name" value={recipeForm.name} onChange={handleFormChange} required style={{ width: '100%', padding: '0.5rem' }}/></label>
                  <label style={{ flex: 1 }}>Image URL<input type="url" name="imageUrl" value={recipeForm.imageUrl} onChange={handleFormChange} style={{ width: '100%', padding: '0.5rem' }}/></label>
                </div>
                <label>Description<textarea name="description" value={recipeForm.description} onChange={handleFormChange} rows="2" style={{ width: '100%', padding: '0.5rem' }}/></label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ flex: 1 }}>Cuisine<input type="text" name="cuisine" value={recipeForm.cuisine} onChange={handleFormChange} style={{ width: '100%', padding: '0.5rem' }}/></label>
                  <label style={{ flex: 1 }}>Meal Type<input type="text" name="mealType" value={recipeForm.mealType} onChange={handleFormChange} style={{ width: '100%', padding: '0.5rem' }}/></label>
                  <label style={{ flex: 1 }}>Difficulty<input type="text" name="difficulty" value={recipeForm.difficulty} onChange={handleFormChange} style={{ width: '100%', padding: '0.5rem' }}/></label>
                </div>
              </fieldset>

              <fieldset style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
                <legend style={{ fontWeight: 'bold' }}>Time & Servings</legend>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ flex: 1 }}>Prep (Mins)<input type="number" name="prepMinutes" value={recipeForm.prepMinutes} onChange={handleFormChange} min="0" style={{ width: '100%', padding: '0.5rem' }}/></label>
                  <label style={{ flex: 1 }}>Cook (Mins)<input type="number" name="cookMinutes" value={recipeForm.cookMinutes} onChange={handleFormChange} min="0" style={{ width: '100%', padding: '0.5rem' }}/></label>
                  <label style={{ flex: 1 }}>Total (Mins)<input type="number" name="totalMinutes" value={recipeForm.totalMinutes} onChange={handleFormChange} min="0" style={{ width: '100%', padding: '0.5rem' }}/></label>
                  {/* CHANGED TO step="any" */}
                  <label style={{ flex: 1 }}>Servings<input type="number" name="servings" step="any" value={recipeForm.servings} onChange={handleFormChange} min="0" style={{ width: '100%', padding: '0.5rem' }}/></label>
                </div>
                <label>Yield Text (e.g., "1 9-inch pie")<input type="text" name="yieldText" value={recipeForm.yieldText} onChange={handleFormChange} style={{ width: '100%', padding: '0.5rem' }}/></label>
              </fieldset>

              <fieldset style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
                <legend style={{ fontWeight: 'bold' }}>Ingredients *</legend>
                {recipeForm.ingredients.map((ing, i) => (
                  <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end', background: '#f9f9f9', padding: '1rem', borderRadius: '4px' }}>
                    <label style={{ flex: '1 1 150px' }}>Name *<input type="text" required value={ing.name} onChange={e => handleArrayChange('ingredients', i, 'name', e.target.value)} style={{ width: '100%', padding: '0.25rem' }}/></label>
                    {/* CHANGED TO step="any" */}
                    <label style={{ flex: '0 0 80px' }}>Qty<input type="number" step="any" value={ing.quantity} onChange={e => handleArrayChange('ingredients', i, 'quantity', e.target.value)} style={{ width: '100%', padding: '0.25rem' }}/></label>
                    <label style={{ flex: '0 0 100px' }}>Unit<input type="text" value={ing.unit} onChange={e => handleArrayChange('ingredients', i, 'unit', e.target.value)} placeholder="cup, tbsp" style={{ width: '100%', padding: '0.25rem' }}/></label>
                    <label style={{ flex: '1 1 150px' }}>Prep<input type="text" value={ing.preparation} onChange={e => handleArrayChange('ingredients', i, 'preparation', e.target.value)} placeholder="chopped, diced" style={{ width: '100%', padding: '0.25rem' }}/></label>
                    <label style={{ flex: '1 1 200px' }}>Original Text<input type="text" value={ing.originalText} onChange={e => handleArrayChange('ingredients', i, 'originalText', e.target.value)} placeholder="1 cup finely chopped onion" style={{ width: '100%', padding: '0.25rem' }}/></label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" checked={ing.optional} onChange={e => handleArrayChange('ingredients', i, 'optional', e.target.checked)}/> Optional</label>
                    {recipeForm.ingredients.length > 1 && (
                      <button type="button" onClick={() => removeArrayItem('ingredients', i)} style={{ padding: '0.25rem 0.5rem', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px' }}>X</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('ingredients', { name: '', originalText: '', quantity: '', quantityText: '', unit: '', preparation: '', section: '', optional: false })} style={{ padding: '0.5rem', background: '#edf2f7', border: '1px solid #cbd5e0', cursor: 'pointer' }}>+ Add Ingredient</button>
              </fieldset>

              <fieldset style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
                <legend style={{ fontWeight: 'bold' }}>Instructions *</legend>
                {recipeForm.instructions.map((inst, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <label style={{ flex: 1 }}>Step {i + 1} *
                      <textarea required value={inst.text} onChange={e => handleArrayChange('instructions', i, 'text', e.target.value)} rows="2" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}/>
                    </label>
                    <label style={{ flex: '0 0 150px' }}>Section Header
                      <input type="text" value={inst.section} onChange={e => handleArrayChange('instructions', i, 'section', e.target.value)} placeholder="e.g. For the Glaze" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}/>
                    </label>
                    {recipeForm.instructions.length > 1 && (
                      <button type="button" onClick={() => removeArrayItem('instructions', i)} style={{ marginTop: '1.75rem', padding: '0.5rem', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px' }}>X</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('instructions', { text: '', section: '' })} style={{ padding: '0.5rem', background: '#edf2f7', border: '1px solid #cbd5e0', cursor: 'pointer' }}>+ Add Instruction Step</button>
              </fieldset>

              <fieldset style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
                <legend style={{ fontWeight: 'bold' }}>Nutrition</legend>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {/* CHANGED TO step="any" */}
                  <label style={{ flex: 1 }}>Calories<input type="number" step="any" value={recipeForm.nutrition.calories} onChange={e => handleNestedChange('nutrition', 'calories', e.target.value)} style={{ width: '100%', padding: '0.5rem' }}/></label>
                  <label style={{ flex: 1 }}>Protein (g)<input type="number" step="any" value={recipeForm.nutrition.protein} onChange={e => handleNestedChange('nutrition', 'protein', e.target.value)} style={{ width: '100%', padding: '0.5rem' }}/></label>
                  <label style={{ flex: 1 }}>Carbs (g)<input type="number" step="any" value={recipeForm.nutrition.carbs} onChange={e => handleNestedChange('nutrition', 'carbs', e.target.value)} style={{ width: '100%', padding: '0.5rem' }}/></label>
                  <label style={{ flex: 1 }}>Fat (g)<input type="number" step="any" value={recipeForm.nutrition.fat} onChange={e => handleNestedChange('nutrition', 'fat', e.target.value)} style={{ width: '100%', padding: '0.5rem' }}/></label>
                </div>
              </fieldset>

              <fieldset style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
                <legend style={{ fontWeight: 'bold' }}>Tags & Keywords</legend>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <strong>Preference Tags</strong>
                    {recipeForm.preferenceTags.map((tag, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input type="text" placeholder="Name (e.g. diet)" value={tag.name} onChange={e => handleArrayChange('preferenceTags', i, 'name', e.target.value)} style={{ width: '40%', padding: '0.25rem' }}/>
                        <input type="text" placeholder="Value (e.g. vegetarian)" value={tag.value} onChange={e => handleArrayChange('preferenceTags', i, 'value', e.target.value)} style={{ width: '40%', padding: '0.25rem' }}/>
                        <button type="button" onClick={() => removeArrayItem('preferenceTags', i)}>X</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addArrayItem('preferenceTags', { name: '', value: '' })} style={{ marginTop: '0.5rem', cursor: 'pointer' }}>+ Add Tag</button>
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong>Keywords</strong>
                    {recipeForm.keywords.map((kw, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input type="text" value={kw} onChange={e => handleArrayChange('keywords', i, null, e.target.value)} style={{ flex: 1, padding: '0.25rem' }}/>
                        <button type="button" onClick={() => removeArrayItem('keywords', i)}>X</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addArrayItem('keywords', '')} style={{ marginTop: '0.5rem', cursor: 'pointer' }}>+ Add Keyword</button>
                  </div>
                </div>
              </fieldset>

              <fieldset style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
                <legend style={{ fontWeight: 'bold' }}>Source</legend>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label>Type
                    <select value={recipeForm.source.kind} onChange={e => handleNestedChange('source', 'kind', e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
                      <option value="manual">Manual</option>
                      <option value="website">Website</option>
                    </select>
                  </label>
                  <label style={{ flex: 1 }}>Author<input type="text" value={recipeForm.source.author} onChange={e => handleNestedChange('source', 'author', e.target.value)} style={{ width: '100%', padding: '0.5rem' }}/></label>
                  <label style={{ flex: 1 }}>Site Name<input type="text" value={recipeForm.source.siteName} onChange={e => handleNestedChange('source', 'siteName', e.target.value)} style={{ width: '100%', padding: '0.5rem' }}/></label>
                </div>
                <label>URL<input type="url" value={recipeForm.source.url} onChange={e => handleNestedChange('source', 'url', e.target.value)} style={{ width: '100%', padding: '0.5rem' }}/></label>
              </fieldset>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '0.75rem 1.5rem', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#ed8936', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>Save Recipe</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <form 
        className="recipe-search" 
        onSubmit={handleSearch} 
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div style={{ display: 'flex', width: '100%' }}>
          <label className="recipe-search-field" style={{ flex: 1, width: '100%', margin: 0 }}>
            <span>Search Recipes</span>
            <input
              type="search"
              value={recipeQuery}
              onChange={(event) => setRecipeQuery(event.target.value)}
              placeholder="e.g. Chicken Alfredo, Tacos..."
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'flex-end' }}>
          <label className="recipe-search-field" style={{ flex: 1, margin: 0 }}>
            <span>Ingredients</span>
            <input
              type="search"
              value={ingredientQuery}
              onChange={(event) => setIngredientQuery(event.target.value)}
              placeholder="spinach, egg, rice"
            />
          </label>

          <label className="recipe-search-field recipe-diet-field" style={{ minWidth: '150px', margin: 0 }}>
            <span>Diet</span>
            <select value={diet} onChange={(event) => setDiet(event.target.value)}>
              {DIET_OPTIONS.map((option) => (
                <option key={option.value || 'any'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="recipe-search-submit" disabled={loading} style={{ margin: 0, height: '100%' }}>
              Search
            </button>
            
            <button 
              type="button" 
              className="recipe-search-submit" 
              onClick={handleRandomRecipe} 
              disabled={loading} 
              style={{ margin: 0, height: '100%' }}
            >
              Random
            </button>

            {searchActive && (
              <button
                type="button"
                className="recipe-search-clear"
                aria-label="Clear recipe search"
                title="Clear search"
                onClick={refreshFeed}
                disabled={loading}
                style={{ margin: 0, height: '100%' }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="recipe-search-options" style={{ margin: 0 }}>
          <label className="recipe-search-check">
            <input
              type="checkbox"
              checked={onlyCurrentIngredients}
              onChange={(event) => setOnlyCurrentIngredients(event.target.checked)}
              disabled={onlyMakeNow}
            />
            <span>Only show recipes with some current ingredients</span>
          </label>
          <label className="recipe-search-check">
            <input
              type="checkbox"
              checked={onlyMakeNow}
              onChange={(event) => {
                setOnlyMakeNow(event.target.checked);
                if (event.target.checked) {
                  setOnlyCurrentIngredients(false);
                }
              }}
            />
            <span>Only show recipes I can make right now</span>
          </label>
        </div>
      </form>

      {loading && <p>Loading recipes...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <div className="recipes-list">
          {recipes.length === 0 ? (
            <p>
              {searchActive
                ? 'No recipes match your search criteria.'
                : showingFavorites
                  ? 'No favorites yet. Tap ♥ on a recipe to save it here.'
                  : 'No more recipes right now. Refresh to load another batch.'}
            </p>
          ) : (
            recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                name={recipe.name}
                instructions={recipe.instructions}
                matchScore={recipe.matchScore}
                matchedIngredients={recipe.matchedIngredients}
                missingIngredients={recipe.missingIngredients}
                feedback={feedback[recipe.id]}
                onFavorite={() => setRecipeFeedback(recipe.id, 'favorite')}
                onDislike={() => setRecipeFeedback(recipe.id, 'dislike')}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}

export default RecipesPanel;