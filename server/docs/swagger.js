/**
 * OpenAPI 3 spec served at /api/docs (Swagger UI) and /api/docs.json.
 *
 * The spec is hand-written for clarity — it's small enough to maintain
 * directly and avoids pulling in JSDoc-style scanners.
 */

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "FilmFusion API",
    version: "1.0.0",
    description:
      "REST API powering FilmFusion — authentication, movies, reviews, voting, trending and admin endpoints.",
  },
  servers: [{ url: "/" }],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "access_token" },
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: { message: { type: "string" }, details: { type: "object" } },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["user", "admin"] },
          avatarUrl: { type: "string", nullable: true },
          bio: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Movie: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          releaseYear: { type: "integer" },
          genre: { type: "string" },
          director: { type: "string" },
          cast: { type: "array", items: { type: "string" } },
          durationMinutes: { type: "integer" },
          imageUrl: { type: "string" },
          trailerUrl: { type: "string" },
          averageRating: { type: "number" },
          reviewCount: { type: "integer" },
        },
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "string" },
          movie: { type: "string" },
          author: { $ref: "#/components/schemas/User" },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          text: { type: "string" },
          upvoteCount: { type: "integer" },
          downvoteCount: { type: "integer" },
          score: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  paths: {
    "/api/health": {
      get: { summary: "Liveness probe", responses: { 200: { description: "OK" } } },
    },
    "/api/auth/register": {
      post: {
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Created" }, 409: { description: "Email exists" } },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Sign in and receive tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" }, 401: { description: "Invalid credentials" } },
      },
    },
    "/api/auth/refresh": {
      post: { summary: "Rotate the refresh token", responses: { 200: { description: "OK" } } },
    },
    "/api/auth/logout": {
      post: { summary: "Revoke the refresh token & clear cookies", responses: { 200: { description: "OK" } } },
    },
    "/api/auth/me": {
      get: { summary: "Return the authenticated user", responses: { 200: { description: "OK" } } },
    },
    "/api/movies": {
      get: {
        summary: "List movies (search/filter/sort/paginate)",
        parameters: [
          { in: "query", name: "q", schema: { type: "string" } },
          { in: "query", name: "genre", schema: { type: "string" } },
          { in: "query", name: "year", schema: { type: "integer" } },
          { in: "query", name: "minRating", schema: { type: "number" } },
          { in: "query", name: "sort", schema: { type: "string", enum: ["newest", "oldest", "rating", "popular", "title"] } },
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: { summary: "Create a movie (admin)", responses: { 201: { description: "Created" } } },
    },
    "/api/movies/trending": { get: { summary: "Trending movies", responses: { 200: { description: "OK" } } } },
    "/api/movies/genres": { get: { summary: "Distinct genres", responses: { 200: { description: "OK" } } } },
    "/api/movies/{id}": {
      get: { summary: "Movie detail", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
      patch: { summary: "Update movie (admin)", responses: { 200: { description: "OK" } } },
      delete: { summary: "Delete movie (admin)", responses: { 204: { description: "Deleted" } } },
    },
    "/api/movies/{id}/reviews": {
      get: { summary: "List reviews for a movie", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
      post: { summary: "Post a review (auth)", responses: { 201: { description: "Created" } } },
    },
    "/api/reviews/{id}": {
      patch: { summary: "Edit a review (owner/admin)", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
      delete: { summary: "Delete a review (owner/admin)", responses: { 204: { description: "Deleted" } } },
    },
    "/api/reviews/{id}/upvote": { post: { summary: "Toggle upvote on a review (auth)", responses: { 200: { description: "OK" } } } },
    "/api/reviews/{id}/downvote": { post: { summary: "Toggle downvote on a review (auth)", responses: { 200: { description: "OK" } } } },
    "/api/users/me": { patch: { summary: "Update profile", responses: { 200: { description: "OK" } } } },
    "/api/users/me/reviews": { get: { summary: "List my reviews", responses: { 200: { description: "OK" } } } },
    "/api/users": { get: { summary: "List users (admin)", responses: { 200: { description: "OK" } } } },
  },
};

export default openApiSpec;
