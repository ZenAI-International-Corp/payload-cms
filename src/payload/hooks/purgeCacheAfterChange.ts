/**
 * Payload Hook: 在内容变更后清除 Cloudflare 缓存
 * 
 * 此 hook 应该添加到需要缓存清除的集合中
 * 
 * 使用 context.waitUntil() 确保缓存清除在后台完成，不阻塞响应
 */

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { purgeCollectionCache } from '../utils/cloudflareCache'

/**
 * 检测是否在 Cloudflare Workers 环境中运行
 */
function isCloudflareWorkers(): boolean {
  return typeof process.versions === 'undefined' || 
         typeof process.env.CF_PAGES !== 'undefined' ||
         typeof (globalThis as any).ASSETS !== 'undefined'
}

/**
 * 获取 Cloudflare Workers 的 ExecutionContext（如果可用）
 */
function getWorkersContext(): any {
  // 在 Next.js + Workers 环境中，可能通过多种方式获取 context
  // 尝试从全局对象获取
  if (typeof (globalThis as any).__env !== 'undefined') {
    return (globalThis as any).__env
  }
  return null
}

/**
 * afterChange hook - 在内容创建、更新或发布后清除缓存
 */
export const purgeCacheAfterChange: CollectionAfterChangeHook = async ({
  doc,
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

  // 创建缓存清除任务
  const cachePurgeTask = purgeCollectionCache(collection.slug, operationType, doc)
    .then(() => {
      console.log(`[Cache] Successfully purged cache for ${collection.slug} (${operationType})`)
    })
    .catch((error) => {
      console.error(`[Cache] Failed to purge cache for ${collection.slug}:`, error)
    })

  // 在 Workers 环境中使用 waitUntil，在其他环境中直接执行
  if (isCloudflareWorkers()) {
    const workersCtx = getWorkersContext()
    if (workersCtx && typeof workersCtx.waitUntil === 'function') {
      // 使用 waitUntil 在后台执行，不阻塞响应
      workersCtx.waitUntil(cachePurgeTask)
      console.log(`[Cache] Scheduled background cache purge for ${collection.slug} (${operationType})`)
    } else {
      // 无法获取 context，记录警告但不阻塞
      console.warn(`[Cache] Workers context not available, skipping cache purge for ${collection.slug}`)
    }
  } else {
    // 非 Workers 环境，异步执行不等待
    cachePurgeTask.catch(() => {}) // 避免未处理的 Promise rejection
    console.log(`[Cache] Triggered async cache purge for ${collection.slug} (${operationType})`)
  }

  return doc
}

/**
 * afterDelete hook - 在内容删除后清除缓存
 */
export const purgeCacheAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
  collection,
  context,
}) => {
  // Prevent cache purge during seeding or migrations
  if (context.skipCachePurge) {
    return doc
  }

  // 创建缓存清除任务
  const cachePurgeTask = purgeCollectionCache(collection.slug, 'delete', doc)
    .then(() => {
      console.log(`[Cache] Successfully purged cache for ${collection.slug} (delete)`)
    })
    .catch((error) => {
      console.error(`[Cache] Failed to purge cache for ${collection.slug}:`, error)
    })

  // 在 Workers 环境中使用 waitUntil，在其他环境中直接执行
  if (isCloudflareWorkers()) {
    const workersCtx = getWorkersContext()
    if (workersCtx && typeof workersCtx.waitUntil === 'function') {
      // 使用 waitUntil 在后台执行，不阻塞响应
      workersCtx.waitUntil(cachePurgeTask)
      console.log(`[Cache] Scheduled background cache purge for ${collection.slug} (delete)`)
    } else {
      // 无法获取 context，记录警告但不阻塞
      console.warn(`[Cache] Workers context not available, skipping cache purge for ${collection.slug}`)
    }
  } else {
    // 非 Workers 环境，异步执行不等待
    cachePurgeTask.catch(() => {}) // 避免未处理的 Promise rejection
    console.log(`[Cache] Triggered async cache purge for ${collection.slug} (delete)`)
  }

  return doc
}

