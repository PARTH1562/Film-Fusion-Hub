import Navbar from "@/components/layout/Navbar";
import MovieCard from "@/components/movies/MovieCard";
import { useMovies, useGenres } from "@/hooks/use-movies";
import { Clapperboard, Loader2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");

  const { data: genres, isLoading: genresLoading } = useGenres();
  const { data: movies, isLoading, error } = useMovies({
    search: searchQuery.trim(),
    genre: selectedGenre !== "All" ? selectedGenre : undefined,
  });

  // Filter movies based on search query (client-side fallback)
  const filteredMovies = useMemo(() => {
    if (!movies) return [];
    if (!searchQuery.trim()) return movies;

    const query = searchQuery.toLowerCase();
    return movies.filter((movie) =>
      movie.title.toLowerCase().includes(query) ||
      movie.genre.toLowerCase().includes(query)
    );
  }, [movies, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Content Section */}
        <div className="space-y-8">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search movies by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-secondary/50 border-border/50 focus-visible:ring-primary/50"
              />
            </div>

            {/* Genre Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="pl-9 w-48 h-11 bg-secondary/50 border-border/50 focus-visible:ring-primary/50">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Genres</SelectItem>
                  {genresLoading ? (
                    <SelectItem value="" disabled>Loading...</SelectItem>
                  ) : (
                    genres?.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-end justify-between border-b border-border/50 pb-4">
            <h2 className="text-2xl font-display font-bold flex items-center gap-3">
              <Clapperboard className="w-6 h-6 text-primary" />
              Featured Films
            </h2>
            <span className="text-sm font-medium text-muted-foreground">
              {filteredMovies?.length || 0} {filteredMovies?.length === 1 ? "Film" : "Films"}
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
              <p>Loading the collection...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-destructive bg-destructive/10 rounded-2xl border border-destructive/20">
              <p className="font-semibold">Failed to load movies. Please try again later.</p>
            </div>
          ) : filteredMovies && filteredMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-8">
              {filteredMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : movies && movies.length > 0 ? (
            <div className="text-center py-32 bg-card rounded-3xl border border-border border-dashed">
              <div className="bg-secondary/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clapperboard className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">No movies found</h3>
              <p className="text-muted-foreground mb-6">Try searching with different keywords.</p>
            </div>
          ) : (
            <div className="text-center py-32 bg-card rounded-3xl border border-border border-dashed">
              <div className="bg-secondary/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clapperboard className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">No movies yet</h3>
              <p className="text-muted-foreground mb-6">Be the first to add a movie to the collection!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
