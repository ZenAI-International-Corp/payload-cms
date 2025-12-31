/**
 * Cloudflare 缓存清除工具
 * 
 * 用于在内容更新时清除 Cloudflare CDN 缓存
 */

interface CloudflarePurgeOptions {
  /**
   * 要清除的 URL 列表（最多 30 个）
   */
  files?: string[]
  /**
   * 要清除的缓存标签列表
   */
  tags?: string[]
  /**
   * 清除所有缓存（慎用！）
   */
  purgeEverything?: boolean
}

interface CloudflareApiResponse {
  success: boolean
  errors?: Array<{ code: number; message: string }>
  messages?: string[]
  result?: any
}

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
   * 缓存标签（优先使用，性能最好）
   */
  tags?: string[]
  /**
   * 要清除的 URL 模式（支持动态参数）
   */
  urlPatterns?: Array<(doc: any, baseUrl: string) => string>
  /**
   * 自定义清除逻辑
   */
  customPurge?: (doc: any, operation: 'create' | 'update' | 'delete') => Promise<void>
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
 * 清除 Cloudflare 缓存
 * 
 * @example
 * // 清除特定 URL
 * await purgeCloudflareCache({
 *   files: ['https://example.com/api/products', 'https://example.com/products']
 * })
 * 
 * @example
 * // 使用缓存标签清除
 * await purgeCloudflareCache({
 *   tags: ['api-products', 'page-products-list']
 * })
 */
export async function purgeCloudflareCache(options: CloudflarePurgeOptions): Promise<void> {
  // 从环境变量获取配置
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!zoneId || !apiToken) {
    console.warn(
      '[Cache] Cloudflare credentials not configured. Skipping cache purge. ' +
      'Please set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN environment variables.'
    )
    return
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      }
    )

    const result = (await response.json()) as CloudflareApiResponse

    if (!response.ok || !result.success) {
      console.error('[Cache] Cloudflare cache purge failed:', result)
      throw new Error(`Cloudflare cache purge failed: ${JSON.stringify(result.errors)}`)
    }

    console.log('[Cache] Successfully purged Cloudflare cache:', options)
  } catch (error) {
    console.error('[Cache] Cache purge error:', error)
    // Don't throw error to avoid affecting normal data operations
  }
}

/**
 * 集合缓存策略注册表
 * 
 * 策略在各自的集合文件中定义，然后通过 registerCollectionCacheStrategy 注册
 * 参见: src/payload/config/cacheStrategies.ts
 */
const collectionCacheStrategies: Record<string, CollectionCacheStrategy> = {}

/**
 * 注册集合缓存策略
 * 
 * @example
 * registerCollectionCacheStrategy('posts', {
 *   tags: ['api-posts', 'page-blog'],
 *   urlPatterns: [
 *     (doc, baseUrl) => `${baseUrl}/blog/${doc.slug}`,
 *   ],
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

/**
 * 根据集合和操作清除相关缓存（优雅版）
 */
export async function purgeCollectionCache(
  collection: string,
  operation: 'create' | 'update' | 'delete',
  doc?: any
): Promise<void> {
  const strategy = collectionCacheStrategies[collection]

  if (!strategy) {
    console.log(`[Cache] No cache strategy configured for collection "${collection}"`)
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://your-domain.com'

  // 1. 按标签清除（推荐，性能最好）
  if (strategy.tags && strategy.tags.length > 0) {
    await purgeCloudflareCache({ tags: strategy.tags })
  }

  // 2. 按 URL 清除（精确清除特定页面）
  if (strategy.urlPatterns && strategy.urlPatterns.length > 0) {
    // 只在更新或删除时清除特定 URL（创建时标签清除就够了）
    if (operation === 'update' || operation === 'delete') {
      const urls = strategy.urlPatterns
        .map(pattern => pattern(doc, baseUrl))
        .filter(url => url && url.length > 0) // 过滤空 URL
      
      if (urls.length > 0) {
        await purgeCloudflareCache({ files: urls })
      }
    }
  }

  // 3. 执行自定义清除逻辑
  if (strategy.customPurge) {
    await strategy.customPurge(doc, operation)
  }
}

/**
 * 批量清除多个 URL
 */
export async function purgeUrls(urls: string[]): Promise<void> {
  // Cloudflare 每次最多清除 30 个 URL
  const chunks = []
  for (let i = 0; i < urls.length; i += 30) {
    chunks.push(urls.slice(i, i + 30))
  }

  for (const chunk of chunks) {
    await purgeCloudflareCache({ files: chunk })
  }
}

/**
 * Purge all cache (use with caution!)
 */
export async function purgeEverything(): Promise<void> {
  console.warn('[Cache] Purging ALL Cloudflare cache...')
  await purgeCloudflareCache({ purgeEverything: true })
}

