import { useState } from 'react';

const STARS = [1, 2, 3, 4, 5];

function summaryText(average, count) {
  if (!count) return 'No ratings yet';
  return `${average.toFixed(1)} (${count} ${count === 1 ? 'rating' : 'ratings'})`;
}

/*
  The user's own 1–5 stars, plus the average across everyone.
  Clicking the current rating again clears it.
*/
function StarRating({ value = null, average = null, count = 0, onRate, disabled = false }) {
  const [hovered, setHovered] = useState(null);
  const shown = hovered ?? value ?? 0;

  return (
    <div className="star-rating">
      <div
        className="star-rating-stars"
        role="group"
        aria-label={value ? `Your rating: ${value} of 5 stars` : 'Rate this recipe'}
        onMouseLeave={() => setHovered(null)}
      >
        {STARS.map((stars) => (
          <button
            key={stars}
            type="button"
            className={`star-rating-star${stars <= shown ? ' filled' : ''}`}
            aria-label={value === stars ? `Clear your ${stars}-star rating` : `Rate ${stars} star${stars === 1 ? '' : 's'}`}
            aria-pressed={value === stars}
            disabled={disabled}
            onMouseEnter={() => setHovered(stars)}
            onFocus={() => setHovered(stars)}
            onBlur={() => setHovered(null)}
            onClick={(event) => {
              event.stopPropagation();
              onRate(stars);
            }}
          >
            ★
          </button>
        ))}
      </div>
      <span className="star-rating-summary">{summaryText(average, count)}</span>
    </div>
  );
}

export default StarRating;
