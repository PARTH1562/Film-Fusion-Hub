/**
 * Wraps an async route handler so any thrown / rejected error is forwarded
 * to Express's error pipeline, eliminating boilerplate try/catch blocks.
 */

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
