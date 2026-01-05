/**
 * Payload Hook: 在内容变更后重新验证 Next.js 静态页面
 * 
 * 此 hook 负责在内容更新时触发 ISR (Incremental Static Regeneration)
 * 
 * 注意：在 Cloudflare Workers 环境中，revalidatePath/revalidateTag 不可用
 * 此时我们依赖 Cloudflare 的 Cache-Tag 清除机制（见 purgeCacheAfterChange.ts）
 */

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import type { Product, Category } from '@/payload-types'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * 检测是否在 Cloudflare Workers 环境中运行
 */
function isCloudflareWorkers(): boolean {
  // Cloudflare Workers 不支持 process.versions
  return typeof process.versions === 'undefined' || 
         typeof process.env.CF_PAGES !== 'undefined' ||
         typeof (globalThis as any).ASSETS !== 'undefined'
}

/**
 * 安全地调用 revalidatePath（在 Workers 环境中跳过）
 */
function safeRevalidatePath(path: string, type?: 'page' | 'layout'): void {
  if (isCloudflareWorkers()) {
    // 在 Workers 环境中，使用 Cache-Tag purging 代替
    // console.log(`[Revalidate] Skipped in Workers: ${path}`)
    return
  }
  
  try {
    if (type) {
      revalidatePath(path, type)
    } else {
      revalidatePath(path)
    }
  } catch (error) {
    console.error(`[Revalidate] Error revalidating path ${path}:`, error)
  }
}

/**
 * 安全地调用 revalidateTag（在 Workers 环境中跳过）
 */
function safeRevalidateTag(tag: string): void {
  if (isCloudflareWorkers()) {
    // 在 Workers 环境中，使用 Cache-Tag purging 代替
    // console.log(`[Revalidate] Skipped in Workers: tag ${tag}`)
    return
  }
  
  try {
    revalidateTag(tag)
  } catch (error) {
    console.error(`[Revalidate] Error revalidating tag ${tag}:`, error)
  }
}

/**
 * 重新验证产品相关的页面
 */
async function revalidateProductPages(doc: Product, operation: 'create' | 'update' | 'delete') {
  try {
    if (isCloudflareWorkers()) {
      // 在 Workers 环境中，缓存清除由 purgeCacheAfterChange hook 处理
      console.log(`[Revalidate] Running in Workers environment, using Cache-Tag purging instead`)
      return
    }

    console.log(`[Revalidate] Starting revalidation for product: ${doc.slug || doc.id}`)

    // 重新验证首页（包含特色产品）
    safeRevalidatePath('/', 'page')
    console.log(`[Revalidate] ✓ Home page`)

    // 重新验证产品列表页
    safeRevalidatePath('/products', 'page')
    console.log(`[Revalidate] ✓ Products list`)

    // 重新验证产品搜索页
    safeRevalidatePath('/products/search', 'page')
    console.log(`[Revalidate] ✓ Products search`)

    // 如果是更新或删除操作，重新验证产品详情页
    if (operation === 'update' && doc.slug) {
      safeRevalidatePath(`/products/${doc.slug}`, 'page')
      console.log(`[Revalidate] ✓ Product detail: /products/${doc.slug}`)
    }

    // 重新验证分类页面（如果产品有分类）
    if (doc.mainCategory) {
      safeRevalidatePath('/products/category', 'page')
      console.log(`[Revalidate] ✓ Category pages`)
    }

    // 使用 tag 重新验证所有产品相关页面
    safeRevalidateTag('products')
    console.log(`[Revalidate] ✓ All pages with 'products' tag`)

    console.log(`[Revalidate] Completed for product: ${doc.slug || doc.id}`)
  } catch (error) {
    console.error('[Revalidate] Error revalidating product pages:', error)
  }
}

/**
 * 重新验证分类相关的页面
 */
async function revalidateCategoryPages(doc: Category, _operation: 'create' | 'update' | 'delete') {
  try {
    if (isCloudflareWorkers()) {
      // 在 Workers 环境中，缓存清除由 purgeCacheAfterChange hook 处理
      console.log(`[Revalidate] Running in Workers environment, using Cache-Tag purging instead`)
      return
    }

    console.log(`[Revalidate] Starting revalidation for category: ${doc.slug || doc.id}`)

    // 重新验证首页
    safeRevalidatePath('/', 'page')
    console.log(`[Revalidate] ✓ Home page`)

    // 重新验证产品列表页
    safeRevalidatePath('/products', 'page')
    console.log(`[Revalidate] ✓ Products list`)

    // 重新验证分类页面
    safeRevalidatePath('/products/category', 'page')
    console.log(`[Revalidate] ✓ Category pages`)

    // 使用 tag 重新验证
    safeRevalidateTag('categories')
    safeRevalidateTag('products')
    console.log(`[Revalidate] ✓ All category and product tags`)

    console.log(`[Revalidate] Completed for category: ${doc.slug || doc.id}`)
  } catch (error) {
    console.error('[Revalidate] Error revalidating category pages:', error)
  }
}

/**
 * afterChange hook - 在内容创建或更新后重新验证页面
 */
export const revalidateAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  collection,
  context,
}) => {
  // 跳过 seeding、migrations 或其他不需要重新验证的操作
  if (context.skipRevalidate) {
    return doc
  }

  const operationType = operation === 'create' ? 'create' : 'update'

  // 根据不同的集合执行不同的重新验证逻辑
  if (collection.slug === 'products') {
    // 异步执行重新验证，不阻塞主流程
    revalidateProductPages(doc, operationType).catch((error) => {
      console.error('[Revalidate] Failed to revalidate product pages:', error)
    })
  } else if (collection.slug === 'categories') {
    revalidateCategoryPages(doc, operationType).catch((error) => {
      console.error('[Revalidate] Failed to revalidate category pages:', error)
    })
  }

  return doc
}

/**
 * afterDelete hook - 在内容删除后重新验证页面
 */
export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
  collection,
  context,
}) => {
  // 跳过 seeding、migrations 或其他不需要重新验证的操作
  if (context.skipRevalidate) {
    return doc
  }

  // 根据不同的集合执行不同的重新验证逻辑
  if (collection.slug === 'products') {
    revalidateProductPages(doc, 'delete').catch((error) => {
      console.error('[Revalidate] Failed to revalidate product pages:', error)
    })
  } else if (collection.slug === 'categories') {
    revalidateCategoryPages(doc, 'delete').catch((error) => {
      console.error('[Revalidate] Failed to revalidate category pages:', error)
    })
  }

  return doc
}

