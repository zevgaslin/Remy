import { getRecipeIllustration } from '../utils/recipeIllustration';

export default function RecipeIllustration({ name, className = '', size = 64 }) {
  const { src, alt } = getRecipeIllustration(name);
  return <img className={`recipe-illustration ${className}`.trim()} src={src} alt={alt}
    width={size} height={size} loading="lazy" decoding="async" />;
}
