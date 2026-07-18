/**
 * Standard response handler utilities
 */

// Success response
export const successResponse = (res, data, message, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

// Error response
export const errorResponse = (res, message, error = null, statusCode = 500) => {
  const response = {
    success: false,
    message
  };
  
  if (error && process.env.NODE_ENV !== 'production') {
    response.error = error.message || error;
  }
  
  return res.status(statusCode).json(response);
};

// Async handler wrapper to eliminate try-catch repetition
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('Error:', error);
      errorResponse(res, 'An error occurred', error);
    });
  };
};

// Not found response
export const notFoundResponse = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    message: `${resource} not found`
  });
};

// Validation error response
export const validationError = (res, message) => {
  return res.status(400).json({
    success: false,
    message
  });
};
