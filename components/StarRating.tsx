
import React from 'react';

interface StarRatingProps {
  rating: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(<span key={i} className="text-amber-500">★</span>);
    } else if (i - 0.5 <= rating) {
      stars.push(<span key={i} className="text-amber-500">★</span>); // Represent half star as full for simplicity
    } else {
      stars.push(<span key={i} className="text-slate-300">☆</span>);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {stars}
      <span className="text-sm text-slate-500 font-semibold ml-1">{rating.toFixed(1)}</span>
    </div>
  );
};

export default StarRating;
