/**
 * Cloudflare CDN Cache Middleware
 * 
 * Sets appropriate cache policies for different request types
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCollectionCacheStrategy, buildCacheControlHeader } from './payload/utils/cloudflareCache'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  const response = NextResponse.next()

  // ========================================
  // 1. Admin Pages - Short-term cache for static admin UI
  // ========================================
  if (pathname.startsWith('/admin')) {
    // Admin UI can be cached (it's static Next.js pages)
    // Only the API calls need to be fresh
    response.headers.set(
      'Cache-Control',
      'private, max-age=60, s-maxage=300, must-revalidate'
    )
    return response
  }

  // ========================================
  // 2. GraphQL API - Cache based on request method
  // ========================================
  if (pathname.startsWith('/api/graphql')) {
    if (method === 'GET') {
      response.headers.set(
        'Cache-Control',
        'public, max-age=60, s-maxage=604800, stale-while-revalidate=86400'
      )
    } else {
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    }
    return response
  }

  // ========================================
  // 3. API Routes - Cache based on authentication and method
  // ========================================
  if (pathname.startsWith('/api/')) {
    // Check if user is authenticated (has payload-token cookie)
    const hasAuthToken = request.cookies.has('payload-token')
    
    // Admin/Authenticated API - No cache
    if (hasAuthToken || method !== 'GET') {
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
      return response
    }

    // Try to match collection API routes
    const apiMatch = pathname.match(/^\/api\/([^\/]+)/)
    if (apiMatch) {
      const collectionSlug = apiMatch[1]
      const strategy = getCollectionCacheStrategy(collectionSlug)
      
      if (strategy?.apiCache) {
        const cacheControl = buildCacheControlHeader(strategy.apiCache)
        response.headers.set('Cache-Control', cacheControl)
        response.headers.set('Vary', 'Accept-Encoding')
        
        if (strategy.apiCache.cacheTag) {
          response.headers.set('Cache-Tag', strategy.apiCache.cacheTag)
        }
        
        return response
      }
    }

    // Default API cache for unregistered collections
    response.headers.set(
      'Cache-Control',
      'public, max-age=60, s-maxage=604800, stale-while-revalidate=86400'
    )
    response.headers.set('Vary', 'Accept-Encoding')
    return response
  }

  // ========================================
  // 4. Next.js Static Assets - Immutable cache
  // ========================================
  if (pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    return response
  }

  // ========================================
  // 5. Image Optimization - Long-term cache
  // ========================================
  if (pathname.startsWith('/_next/image')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400'
    )
    return response
  }

  // ========================================
  // 6. Collection Pages - Load cache config from strategies
  // ========================================
  
  // Try to match collection pages
  const pageMatch = pathname.match(/^\/([^\/]+)/)
  if (pageMatch) {
    const collectionSlug = pageMatch[1]
    const strategy = getCollectionCacheStrategy(collectionSlug)
    
    if (strategy?.pageCache) {
      const cacheControl = buildCacheControlHeader(strategy.pageCache)
      response.headers.set('Cache-Control', cacheControl)
      response.headers.set('Vary', 'Accept-Encoding')
      
      if (strategy.pageCache.cacheTag) {
        response.headers.set('Cache-Tag', strategy.pageCache.cacheTag)
      }
      
      return response
    }
  }

  // Special case: Home page
  if (pathname === '/') {
    response.headers.set(
      'Cache-Control',
      'public, max-age=120, s-maxage=604800, stale-while-revalidate=86400'
    )
    response.headers.set('Vary', 'Accept-Encoding')
    response.headers.set('Cache-Tag', 'page-home')
    return response
  }

  // ========================================
  // 7. Static Assets - Long-term cache
  // ========================================
  const staticExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.woff', '.woff2', '.css', '.js']
  if (staticExtensions.some(ext => pathname.endsWith(ext))) {
    const isFont = pathname.endsWith('.woff') || pathname.endsWith('.woff2')
    if (isFont) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    } else {
      response.headers.set(
        'Cache-Control',
        'public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400'
      )
    }
    return response
  }

  // ========================================
  // 8. Default - Short-term cache
  // ========================================
  response.headers.set(
    'Cache-Control',
    'public, max-age=60, s-maxage=604800, stale-while-revalidate=86400'
  )
  response.headers.set('Vary', 'Accept-Encoding')

  return response
}

// Middleware matcher configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

