import { useState } from "react";
import { Star } from "lucide-react";

interface InteractiveStarRatingProps {
  value: number;
  onChange: (value: number) => void;
}

export default function InteractiveStarRating({ value, onChange }: InteractiveStarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1.5" onMouseLeave={() => setHoverValue(null)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hoverValue ?? value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            className={`
              p-1 rounded-full transition-all duration-200
              hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
              ${isActive ? 'text-primary' : 'text-muted-foreground/40'}
            `}
          >
            <Star 
              className={`w-8 h-8 transition-colors ${isActive ? 'fill-primary' : ''}`} 
              strokeWidth={isActive ? 0 : 2} 
            />
          </button>
        );
      })}
    </div>
  );
}
