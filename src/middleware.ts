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

  let response = NextResponse.next()

  // ========================================
  // 1. Admin - Disable cache completely
  // ========================================
  if (pathname.startsWith('/admin')) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }

  // ========================================
  // 2. GraphQL API - Cache based on request method
  // ========================================
  if (pathname.startsWith('/api/graphql')) {
    if (method === 'GET') {
      response.headers.set(
        'Cache-Control',
        'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
      )
    } else {
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    }
    return response
  }

  // ========================================
  // 3. Collection API Routes - Load cache config from strategies
  // ========================================
  if (pathname.startsWith('/api/')) {
    // Only cache GET requests
    if (method !== 'GET') {
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
      'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
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
      'public, max-age=300, s-maxage=3600, stale-while-revalidate=600'
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
        'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400'
      )
    }
    return response
  }

  // ========================================
  // 8. Default - Short-term cache
  // ========================================
  response.headers.set(
    'Cache-Control',
    'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
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

