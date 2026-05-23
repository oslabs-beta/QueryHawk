import rateLimit from 'express-rate-limit';

export const optimizationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many optimization requests, please try again later.',
});
