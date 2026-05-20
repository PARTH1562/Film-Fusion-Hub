import StarRating from "../shared/StarRating";
import type { Review } from "@shared/schema";
import { UserCircle2 } from "lucide-react";

export default function ReviewItem({ review }: { review: Review }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-border transition-colors group">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
            <UserCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{review.authorName}</h4>
            <div className="mt-1">
              <StarRating rating={review.rating} size="sm" />
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-muted-foreground leading-relaxed">
        "{review.reviewText}"
      </p>
    </div>
  );
}
