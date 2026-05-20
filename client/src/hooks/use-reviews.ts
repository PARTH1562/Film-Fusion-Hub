import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertReview } from "@shared/routes";

export function useReviews(movieId: number) {
  return useQuery({
    queryKey: [api.reviews.listByMovie.path, movieId],
    queryFn: async () => {
      const url = buildUrl(api.reviews.listByMovie.path, { movieId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      return api.reviews.listByMovie.responses[200].parse(data);
    },
    enabled: !!movieId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertReview) => {
      const res = await fetch(api.reviews.create.path, {
        method: api.reviews.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.reviews.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create review");
      }
      return api.reviews.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate the reviews list for this specific movie
      queryClient.invalidateQueries({ 
        queryKey: [api.reviews.listByMovie.path, variables.movieId] 
      });
      // Also invalidate the movie list and specific movie to update the average rating
      queryClient.invalidateQueries({ queryKey: [api.movies.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.movies.get.path, variables.movieId] });
    },
  });
}
