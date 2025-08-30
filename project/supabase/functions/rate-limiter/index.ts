import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // General API endpoints
  DEFAULT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  
  // Authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per window
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },
  
  // Booking endpoints
  BOOKING: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 booking attempts per hour
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  
  // Admin endpoints
  ADMIN: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50, // 50 requests per 5 minutes
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  
  // Email endpoints
  EMAIL: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 email requests per hour
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

// In-memory rate limit store (in production, use Redis or database)
const rateLimitStore = new Map<string, RateLimitEntry>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get client IP and user agent
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const endpoint = new URL(req.url).pathname;
    
    // Determine rate limit configuration based on endpoint
    let config = RATE_LIMIT_CONFIG.DEFAULT;
    
    if (endpoint.includes('/auth') || endpoint.includes('/login') || endpoint.includes('/signup')) {
      config = RATE_LIMIT_CONFIG.AUTH;
    } else if (endpoint.includes('/booking') || endpoint.includes('/book')) {
      config = RATE_LIMIT_CONFIG.BOOKING;
    } else if (endpoint.includes('/admin')) {
      config = RATE_LIMIT_CONFIG.ADMIN;
    } else if (endpoint.includes('/email') || endpoint.includes('/send-email')) {
      config = RATE_LIMIT_CONFIG.EMAIL;
    }
    
    // Create rate limit key
    const rateLimitKey = `${clientIP}:${endpoint}`;
    const now = Date.now();
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(rateLimitKey);
    
    if (!entry || now > entry.resetTime) {
      // Create new rate limit window
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false
      };
      rateLimitStore.set(rateLimitKey, entry);
    }
    
    // Check if client is blocked
    if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
      const remainingBlockTime = Math.ceil((entry.blockUntil - now) / 1000);
      
      console.warn(`🚫 Rate limit blocked: ${clientIP} on ${endpoint} for ${remainingBlockTime}s`);
      
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: remainingBlockTime,
          endpoint,
          timestamp: new Date().toISOString()
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': remainingBlockTime.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
          }
        }
      );
    }
    
    // Increment request count
    entry.count++;
    
    // Check if rate limit exceeded
    if (entry.count > config.maxRequests) {
      // Block client for the remaining window time
      entry.blocked = true;
      entry.blockUntil = entry.resetTime;
      
      console.warn(`🚫 Rate limit exceeded: ${clientIP} on ${endpoint} (${entry.count}/${config.maxRequests})`);
      
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(config.windowMs / 1000),
          endpoint,
          timestamp: new Date().toISOString()
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
          }
        }
      );
    }
    
    // Log rate limit info
    console.log(`📊 Rate limit: ${clientIP} on ${endpoint} (${entry.count}/${config.maxRequests})`);
    
    // Add rate limit headers to response
    const responseHeaders = {
      ...corsHeaders,
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, config.maxRequests - entry.count).toString(),
      'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
    };
    
    // Store rate limit data in database for monitoring
    try {
      await supabaseClient
        .from('rate_limit_logs')
        .insert({
          client_ip: clientIP,
          endpoint: endpoint,
          user_agent: userAgent,
          request_count: entry.count,
          rate_limit_config: config,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log rate limit data:', error);
    }
    
    // Clean up old entries (keep only last 1000 entries)
    if (rateLimitStore.size > 1000) {
      const oldestKey = rateLimitStore.keys().next().value;
      rateLimitStore.delete(oldestKey);
    }
    
    return new Response(
      JSON.stringify({
        message: 'Rate limit check passed',
        remaining: Math.max(0, config.maxRequests - entry.count),
        resetTime: new Date(entry.resetTime).toISOString(),
        endpoint,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Rate limiter error:', error)
    return new Response(
      JSON.stringify({
        error: 'Rate limiter error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
