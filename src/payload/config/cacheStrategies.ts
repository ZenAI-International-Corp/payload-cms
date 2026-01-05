/**
 * 统一注册所有集合的缓存清除策略
 * 
 * 此文件在应用启动时加载，将所有集合的缓存策略注册到系统中
 */

import { registerCollectionCacheStrategy } from '../utils/cloudflareCache'
import { ProductsCacheStrategy } from '../../collections/Products'
import { CategoriesCacheStrategy } from '../../collections/Categories'

/**
 * Register all collection cache strategies
 */
export function registerAllCacheStrategies(): void {
  // Products collection
  registerCollectionCacheStrategy('products', ProductsCacheStrategy)

  // Categories collection
  registerCollectionCacheStrategy('categories', CategoriesCacheStrategy)

  console.log('[Cache] Registered all collection cache strategies')
}

/**
 * 使用说明：
 * 
 * 1. 在集合文件中定义缓存策略：
 * 
 * ```typescript
 * // src/collections/YourCollection.ts
 * export const YourCollectionCacheStrategy: CollectionCacheStrategy = {
 *   tags: ['api-your-collection', 'page-your-collection'],
 *   urlPatterns: [
 *     (doc, baseUrl) => `${baseUrl}/api/your-collection`,
 *     (doc, baseUrl) => doc?.slug ? `${baseUrl}/your-collection/${doc.slug}` : '',
 *   ],
 * }
 * ```
 * 
 * 2. 在集合中启用缓存清除 hooks：
 * 
 * ```typescript
 * import { purgeCacheAfterChange, purgeCacheAfterDelete } from '../payload/hooks/purgeCacheAfterChange'
 * 
 * export const YourCollection: CollectionConfig = {
 *   hooks: {
 *     afterChange: [purgeCacheAfterChange],
 *     afterDelete: [purgeCacheAfterDelete],
 *   },
 * }
 * ```
 * 
 * 3. 在此文件中注册策略：
 * 
 * ```typescript
 * import { YourCollectionCacheStrategy } from '../../collections/YourCollection'
 * registerCollectionCacheStrategy('your-collection', YourCollectionCacheStrategy)
 * ```
 */

