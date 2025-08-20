import { SetMetadata } from '@nestjs/common';
import { TokenBucketConfig } from '../guards/advanced-rate-limit.guard';

export const RATE_LIMIT_KEY = 'rate-limit-config';

export const RateLimit = (config: TokenBucketConfig) => SetMetadata(RATE_LIMIT_KEY, config);

// Predefined rate limit configurations
export const RateLimitPresets = {
  // Strict limits for authentication endpoints
  AUTH_LOGIN: {
    capacity: 5,
    refillRate: 1,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please try again later.',
  },
  
  AUTH_REGISTER: {
    capacity: 3,
    refillRate: 0.5,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Registration rate limit exceeded. Please try again later.',
  },

  // API endpoints
  API_GENERAL: {
    capacity: 100,
    refillRate: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'API rate limit exceeded.',
  },

  API_SEARCH: {
    capacity: 50,
    refillRate: 5,
    windowMs: 60 * 1000, // 1 minute
    message: 'Search rate limit exceeded.',
  },

  API_UPLOAD: {
    capacity: 10,
    refillRate: 1,
    windowMs: 60 * 1000, // 1 minute
    message: 'Upload rate limit exceeded.',
  },

  // Admin endpoints
  ADMIN_ACTIONS: {
    capacity: 20,
    refillRate: 2,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => `admin:${req.user?.sub || req.ip}`,
    message: 'Admin action rate limit exceeded.',
  },
} as const;
