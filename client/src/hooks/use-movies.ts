import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertMovie } from "@shared/routes";

export function useMovies(filters?: { genre?: string; search?: string }) {
  const queryParams = new URLSearchParams();
  if (filters?.genre && filters.genre !== "All") {
    queryParams.set("genre", filters.genre);
  }
  if (filters?.search) {
    queryParams.set("q", filters.search);
  }

  const url = queryParams.toString() ? `${api.movies.list.path}?${queryParams.toString()}` : api.movies.list.path;

  return useQuery({
    queryKey: [api.movies.list.path, filters],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch movies");
      const data = await res.json();
      return api.movies.list.responses[200].parse(data);
    },
  });
}

export function useGenres() {
  return useQuery({
    queryKey: ["genres"],
    queryFn: async () => {
      const res = await fetch("/api/movies/genres", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch genres");
      const data = await res.json();
      return data.genres as string[];
    },
  });
}

export function useMovie(id: number) {
  return useQuery({
    queryKey: [api.movies.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.movies.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch movie");
      const data = await res.json();
      return api.movies.get.responses[200].parse(data);
    },
    enabled: !!id,
  });
}

export function useCreateMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertMovie) => {
      const res = await fetch(api.movies.create.path, {
        method: api.movies.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.movies.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create movie");
      }
      return api.movies.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.movies.list.path] });
    },
  });
}
