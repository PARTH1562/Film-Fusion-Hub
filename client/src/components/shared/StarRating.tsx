import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
}

export default function StarRating({ rating, max = 5, size = "md", showNumber = false }: StarRatingProps) {
  const sizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6"
  };

  const gap = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-1.5"
  };

  // Ensure rating is between 0 and max
  const safeRating = Math.max(0, Math.min(rating, max));
  
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center ${gap[size]}`}>
        {Array.from({ length: max }).map((_, index) => {
          // Calculate how much of this specific star should be filled
          const fillPercentage = Math.max(0, Math.min(100, (safeRating - index) * 100));
          
          return (
            <div key={index} className={`relative ${sizes[size]}`}>
              {/* Background Star */}
              <Star 
                className={`absolute inset-0 ${sizes[size]} text-muted-foreground/30`} 
                strokeWidth={2}
              />
              
              {/* Foreground (Filled) Star - clipped using width percentage */}
              <div 
                className="absolute inset-0 overflow-hidden" 
                style={{ width: `${fillPercentage}%` }}
              >
                <Star 
                  className={`${sizes[size]} text-primary fill-primary`} 
                  strokeWidth={2}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {showNumber && (
        <span className="font-display font-medium text-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
