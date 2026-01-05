/**
 * Payload Hook: 在内容变更后重新验证 Next.js 静态页面
 * 
 * 此 hook 负责在内容更新时触发 ISR (Incremental Static Regeneration)
 */

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * 重新验证产品相关的页面
 */
async function revalidateProductPages(doc: any, operation: 'create' | 'update' | 'delete') {
  try {
    console.log(`[Revalidate] Starting revalidation for product: ${doc.slug || doc.id}`)

    // 重新验证首页（包含特色产品）
    revalidatePath('/', 'page')
    console.log(`[Revalidate] ✓ Home page`)

    // 重新验证产品列表页
    revalidatePath('/products', 'page')
    console.log(`[Revalidate] ✓ Products list`)

    // 重新验证产品搜索页
    revalidatePath('/products/search', 'page')
    console.log(`[Revalidate] ✓ Products search`)

    // 如果是更新或删除操作，重新验证产品详情页
    if (operation === 'update' && doc.slug) {
      revalidatePath(`/products/${doc.slug}`, 'page')
      console.log(`[Revalidate] ✓ Product detail: /products/${doc.slug}`)
    }

    // 重新验证分类页面（如果产品有分类）
    if (doc.mainCategory) {
      const categoryId = typeof doc.mainCategory === 'object' ? doc.mainCategory.id : doc.mainCategory
      revalidatePath('/products/category', 'page')
      console.log(`[Revalidate] ✓ Category pages`)
    }

    // 使用 tag 重新验证所有产品相关页面
    revalidateTag('products')
    console.log(`[Revalidate] ✓ All pages with 'products' tag`)

    console.log(`[Revalidate] Completed for product: ${doc.slug || doc.id}`)
  } catch (error) {
    console.error('[Revalidate] Error revalidating product pages:', error)
  }
}

/**
 * 重新验证分类相关的页面
 */
async function revalidateCategoryPages(doc: any, operation: 'create' | 'update' | 'delete') {
  try {
    console.log(`[Revalidate] Starting revalidation for category: ${doc.slug || doc.id}`)

    // 重新验证首页
    revalidatePath('/', 'page')
    console.log(`[Revalidate] ✓ Home page`)

    // 重新验证产品列表页
    revalidatePath('/products', 'page')
    console.log(`[Revalidate] ✓ Products list`)

    // 重新验证分类页面
    revalidatePath('/products/category', 'page')
    console.log(`[Revalidate] ✓ Category pages`)

    // 使用 tag 重新验证
    revalidateTag('categories')
    revalidateTag('products')
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
  req,
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
  req,
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

