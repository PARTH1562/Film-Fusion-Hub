import { useParams, Link } from "wouter";
import { useMovie } from "@/hooks/use-movies";
import { useReviews } from "@/hooks/use-reviews";
import Navbar from "@/components/layout/Navbar";
import StarRating from "@/components/shared/StarRating";
import ReviewItem from "@/components/reviews/ReviewItem";
import CreateReviewDialog from "@/components/reviews/CreateReviewDialog";
import { ChevronLeft, Loader2, Calendar, Film, MessageSquareQuote } from "lucide-react";
import { useState } from "react";

export default function MovieDetail() {
  const params = useParams();
  const movieId = parseInt(params.id || "0", 10);
  
  const { data: movie, isLoading: loadingMovie } = useMovie(movieId);
  const { data: reviews, isLoading: loadingReviews } = useReviews(movieId);

  if (loadingMovie) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Loading movie details...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">Movie not found</h2>
          <Link href="/" className="text-primary hover:underline inline-flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back to collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group font-medium">
          <div className="p-1 rounded-full bg-secondary group-hover:bg-primary/20 group-hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Back to Collection
        </Link>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
          {/* Left Column: Poster */}
          <div className="w-full md:w-1/3 lg:w-1/4 shrink-0">
            <div className="sticky top-28 rounded-2xl overflow-hidden poster-shadow border border-border/50 aspect-[2/3] bg-muted">
              {(movie.imageUrl || (movie as any).poster) ? (
                <img
                  src={movie.imageUrl || (movie as any).poster}
                  alt={`${movie.title} poster`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Film className="w-16 h-16 mb-4 opacity-30" />
                  <span className="font-semibold uppercase tracking-widest text-sm opacity-50">No Poster</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Info & Reviews */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col pt-2 md:pt-4">
            
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground mb-4">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border">
                <Calendar className="w-4 h-4" /> {movie.releaseYear}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border">
                <Film className="w-4 h-4" /> {movie.genre}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6">
              {movie.title}
            </h1>

            {/* Rating Highlights */}
            <div className="flex items-center gap-6 mb-8 p-6 rounded-2xl bg-card border border-border/50">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Average Rating</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-display font-bold text-foreground">
                    {movie.averageRating ? movie.averageRating.toFixed(1) : "N/A"}
                  </span>
                  <span className="text-lg text-muted-foreground font-medium">/ 5</span>
                </div>
              </div>
              
              <div className="w-px h-12 bg-border"></div>
              
              <div className="flex flex-col gap-2">
                <StarRating rating={movie.averageRating || 0} size="lg" />
                <span className="text-sm text-muted-foreground font-medium">
                  Based on {movie.reviewCount} {movie.reviewCount === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-12">
              <h3 className="text-xl font-display font-semibold mb-3">Synopsis</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {movie.description}
              </p>
            </div>

            {/* Reviews Section */}
            <div className="pt-12 border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <h3 className="text-2xl font-display font-bold flex items-center gap-3">
                  <MessageSquareQuote className="w-6 h-6 text-primary" />
                  Community Reviews
                </h3>
                <CreateReviewDialog movieId={movie.id} movieTitle={movie.title} />
              </div>

              {loadingReviews ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : reviews && reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((review) => (
                    <ReviewItem key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-card rounded-2xl border border-border border-dashed">
                  <div className="bg-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquareQuote className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium mb-1">No reviews yet</p>
                  <p className="text-muted-foreground">Be the first to share your thoughts on {movie.title}!</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
