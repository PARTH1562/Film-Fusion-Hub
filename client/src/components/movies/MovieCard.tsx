import { Link } from "wouter";
import StarRating from "../shared/StarRating";
import type { MovieWithRating } from "@shared/routes";
import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";

export default function MovieCard({ movie }: { movie: MovieWithRating }) {
  return (
    <Link href={`/movies/${movie.id}`} className="group block">
      <div className="flex flex-col gap-3">
        {/* Poster Container */}
        <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-muted poster-shadow group-hover:-translate-y-2 transition-all duration-300 ease-out border border-border/50 group-hover:border-primary/50 group-hover:shadow-primary/20">
          {(movie.imageUrl || (movie as any).poster) ? (
            <img
              src={movie.imageUrl || (movie as any).poster}
              alt={`${movie.title} poster`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
              <span className="text-xs uppercase tracking-wider font-semibold">No Poster</span>
            </div>
          )}

          {/* Rating Badge Overlay */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-xl">
            <StarRating rating={movie.averageRating || 0} max={1} size="sm" />
            <span className="text-sm font-bold text-white font-display">
              {movie.averageRating ? movie.averageRating.toFixed(1) : "N/A"}
            </span>
          </div>

          {/* Hover Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Info */}
        <div className="px-1">
          <h3 className="font-display font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between mt-1 text-sm text-muted-foreground">
            <span>{movie.releaseYear}</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary/50 text-xs font-medium border border-border">
              {movie.genre}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
