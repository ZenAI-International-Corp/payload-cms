import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Category } from '@/payload-types'
import { ProductDetail } from '@/frontend/components'
import { notFound } from 'next/navigation'
import { getAllRelatedProducts } from '@/payload/utils/productRelations'

// 动态渲染配置
// 在 Cloudflare Workers 中，缓存由 middleware.ts 的 Cache-Control 头控制
export const dynamic = 'force-dynamic'
export const dynamicParams = true // 允许动态生成未预渲染的页面

// 生成页面元数据
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })
  
  const result = await payload.find({
    collection: 'products',
    where: {
      slug: { equals: slug },
      status: { equals: 'visible' },
    },
    limit: 1,
    depth: 0,
  })

  const product = result.docs[0]

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: `${product.model} - Products`,
    description: product.description || `Details for ${product.model}`,
  }
}

// 服务器组件 - 在服务器端获取数据
export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })

  // 获取产品数据
  const result = await payload.find({
    collection: 'products',
    where: {
      slug: { equals: slug },
      status: { equals: 'visible' },
    },
    limit: 1,
    depth: 2, // Populate relationships
  })

  const product = result.docs[0]

  if (!product) {
    notFound()
  }

  // 获取所有相关分类
  const categoryIdsToFetch = new Set<number>()

  // 添加主分类
  if (product.mainCategory) {
    const mainCategoryId =
      typeof product.mainCategory === 'object' ? product.mainCategory.id : product.mainCategory
    if (typeof mainCategoryId === 'number') {
      categoryIdsToFetch.add(mainCategoryId)
    }
  }

  // 添加所有分类
  if (product.categories && Array.isArray(product.categories)) {
    product.categories.forEach((cat) => {
      const catId = typeof cat === 'object' ? cat.id : cat
      if (typeof catId === 'number') {
        categoryIdsToFetch.add(catId)
      }
    })
  }

  // 批量获取所有分类
  let allCategories: Category[] = []
  if (categoryIdsToFetch.size > 0) {
    const categoriesResult = await payload.find({
      collection: 'categories',
      where: {
        id: { in: Array.from(categoryIdsToFetch) },
      },
      limit: 100,
      depth: 0,
    })
    allCategories = categoriesResult.docs
  }

  // 排序：主分类在前
  const mainCategoryId =
    typeof product.mainCategory === 'object' ? product.mainCategory?.id : product.mainCategory
  const sortedCategories = allCategories.sort((a, b) => {
    if (a.id === mainCategoryId) return -1
    if (b.id === mainCategoryId) return 1
    return 0
  })

  // 获取图片数据
  const galleryImages =
    product.gallery && Array.isArray(product.gallery)
      ? product.gallery
          .map((item) => {
            if (item?.image && typeof item.image === 'object' && typeof item.image.url === 'string') {
              return {
                url: item.image.url,
                alt: item.alt || product.model || 'Product image',
              }
            }
            return null
          })
          .filter((img): img is { url: string; alt: string } => img !== null)
      : []

  const description =
    product.description && typeof product.description === 'string'
      ? product.description
      : product.description
        ? String(product.description)
        : null

  // Get related products
  const relations = await getAllRelatedProducts(payload, product.id, true)
  
  const relatedProducts = {
    // Direct relations (outgoing)
    accessories: relations.directRelations.filter(r => r.relationType === 'accessory'),
    compatible: relations.directRelations.filter(r => r.relationType === 'compatible'),
    alternatives: relations.directRelations.filter(r => r.relationType === 'alternative'),
    upgrades: relations.directRelations.filter(r => r.relationType === 'upgrade'),
    related: relations.directRelations.filter(r => r.relationType === 'related'),
    
    // Reverse relations (incoming) - grouped by type
    reverseAccessories: relations.reverseRelations.filter(r => r.relationType === 'accessory'),
    reverseCompatible: relations.reverseRelations.filter(r => r.relationType === 'compatible'),
    reverseAlternatives: relations.reverseRelations.filter(r => r.relationType === 'alternative'),
    reverseUpgrades: relations.reverseRelations.filter(r => r.relationType === 'upgrade'),
    reverseRelated: relations.reverseRelations.filter(r => r.relationType === 'related'),
  }

  return (
    <ProductDetail
      product={product}
      allCategories={sortedCategories}
      galleryImages={galleryImages}
      description={description}
      relatedProducts={relatedProducts}
    />
  )
}

