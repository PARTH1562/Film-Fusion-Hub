import { z } from 'zod';
import { insertMovieSchema, insertReviewSchema, movies, reviews } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const movieWithRatingSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  releaseYear: z.number(),
  genre: z.string(),
  imageUrl: z.string(),
  averageRating: z.number(),
  reviewCount: z.number(),
});

export const api = {
  movies: {
    list: {
      method: 'GET' as const,
      path: '/api/movies' as const,
      responses: {
        200: z.array(movieWithRatingSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/movies/:id' as const,
      responses: {
        200: movieWithRatingSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/movies' as const,
      input: insertMovieSchema,
      responses: {
        201: z.custom<typeof movies.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  reviews: {
    listByMovie: {
      method: 'GET' as const,
      path: '/api/movies/:movieId/reviews' as const,
      responses: {
        200: z.array(z.custom<typeof reviews.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reviews' as const,
      input: insertReviewSchema,
      responses: {
        201: z.custom<typeof reviews.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }),
      responses: {
        200: z.object({
          user: z.object({
            id: z.number(),
            email: z.string(),
            name: z.string(),
          }),
          token: z.string(),
        }),
        401: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
    signup: {
      method: 'POST' as const,
      path: '/api/auth/signup' as const,
      input: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      }),
      responses: {
        201: z.object({
          user: z.object({
            id: z.number(),
            email: z.string(),
            name: z.string(),
          }),
          token: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.object({
          user: z.object({
            id: z.number(),
            email: z.string(),
            name: z.string(),
          }),
        }),
        401: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type MovieWithRating = z.infer<typeof movieWithRatingSchema>;
export type InsertMovie = z.infer<typeof api.movies.create.input>;
export type InsertReview = z.infer<typeof api.reviews.create.input>;
