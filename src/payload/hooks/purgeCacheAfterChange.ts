/**
 * Payload Hook: 在内容变更后清除 Cloudflare 缓存
 * 
 * 此 hook 应该添加到需要缓存清除的集合中
 */

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { purgeCollectionCache } from '../utils/cloudflareCache'

/**
 * afterChange hook - 在内容创建、更新或发布后清除缓存
 */
export const purgeCacheAfterChange: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  collection,
  context,
}) => {
  // Prevent cache purge during seeding or migrations
  if (context.skipCachePurge) {
    return doc
  }

  // Determine operation type
  const operationType = operation === 'create' ? 'create' : 'update'

  // Asynchronously purge cache (non-blocking)
  purgeCollectionCache(collection.slug, operationType, doc).catch((error) => {
    console.error(`[Cache] Failed to purge cache for ${collection.slug}:`, error)
  })

  console.log(`[Cache] Triggered cache purge for ${collection.slug} (${operationType})`)

  return doc
}

/**
 * afterDelete hook - 在内容删除后清除缓存
 */
export const purgeCacheAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
  req,
  collection,
  context,
}) => {
  // Prevent cache purge during seeding or migrations
  if (context.skipCachePurge) {
    return doc
  }

  // Asynchronously purge cache
  purgeCollectionCache(collection.slug, 'delete', doc).catch((error) => {
    console.error(`[Cache] Failed to purge cache for ${collection.slug}:`, error)
  })

  console.log(`[Cache] Triggered cache purge for ${collection.slug} (delete)`)

  return doc
}

