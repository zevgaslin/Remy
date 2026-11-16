import { getRecipeIllustration } from '../utils/recipeIllustration';

export default function RecipeIllustration({ name, className = '', size = 64, alt: altProp }) {
  const { src, alt } = getRecipeIllustration(name);
  return <img className={`recipe-illustration ${className}`.trim()} src={src} alt={altProp ?? alt}
    width={size} height={size} loading="lazy" decoding="async" />;
}
