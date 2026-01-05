/**
 * Cloudflare 缓存配置工具
 * 
 * 仅用于定义和管理缓存时间配置
 */

/**
 * Cache-Control header configuration
 */
export interface CacheControlConfig {
  /**
   * Browser cache time (seconds)
   */
  maxAge: number
  /**
   * CDN cache time (seconds)
   */
  sMaxAge: number
  /**
   * Stale-while-revalidate time (seconds)
   */
  staleWhileRevalidate?: number
  /**
   * Cache tag for targeted purging
   */
  cacheTag?: string
  /**
   * Whether this is public cache (default: true)
   */
  public?: boolean
}

/**
 * 集合缓存策略配置
 */
export interface CollectionCacheStrategy {
  /**
   * API 路由缓存配置（/api/{collection}）
   */
  apiCache?: CacheControlConfig
  /**
   * 前端页面缓存配置（/{collection}/*）
   */
  pageCache?: CacheControlConfig
}

/**
 * 集合缓存策略注册表
 */
const collectionCacheStrategies: Record<string, CollectionCacheStrategy> = {}

/**
 * 注册集合缓存策略
 * 
 * @example
 * registerCollectionCacheStrategy('posts', {
 *   apiCache: {
 *     maxAge: 60,
 *     sMaxAge: 300,
 *     staleWhileRevalidate: 60,
 *     cacheTag: 'api-posts',
 *   },
 *   pageCache: {
 *     maxAge: 120,
 *     sMaxAge: 600,
 *     staleWhileRevalidate: 60,
 *     cacheTag: 'page-posts',
 *   },
 * })
 */
export function registerCollectionCacheStrategy(
  collection: string,
  strategy: CollectionCacheStrategy
): void {
  collectionCacheStrategies[collection] = strategy
}

/**
 * 获取集合的缓存策略
 */
export function getCollectionCacheStrategy(collection: string): CollectionCacheStrategy | undefined {
  return collectionCacheStrategies[collection]
}

/**
 * 生成 Cache-Control 头字符串
 */
export function buildCacheControlHeader(config: CacheControlConfig): string {
  const parts: string[] = []
  
  parts.push(config.public !== false ? 'public' : 'private')
  parts.push(`max-age=${config.maxAge}`)
  parts.push(`s-maxage=${config.sMaxAge}`)
  
  if (config.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`)
  }
  
  return parts.join(', ')
}
