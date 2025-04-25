/**
 * Async handler to avoid try-catch blocks in route handlers
 * @param {Function} fn - The async function to handle
 */
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
  
  module.exports = asyncHandler;