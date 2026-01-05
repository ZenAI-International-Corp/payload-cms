import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProductsCenter } from '@/frontend/components'

// 动态渲染配置
// 在 Cloudflare Workers 中，缓存由 middleware.ts 的 Cache-Control 头控制
export const dynamic = 'force-dynamic'

// 生成页面元数据
export const metadata = {
  title: 'Product Categories',
  description: 'Browse products by category',
}

// 服务器组件 - 根据 URL 参数在服务器端筛选产品
export default async function ProductCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subcategory?: string }>
}) {
  const params = await searchParams
  const categoryId = params.category ? Number(params.category) : null
  const subcategoryIds = params.subcategory
    ? params.subcategory.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id))
    : []

  const payload = await getPayload({ config })

  // 构建查询条件
  const where: any = {
    status: { equals: 'visible' },
  }

  // 如果有分类筛选
  if (categoryId !== null) {
    where.mainCategory = { equals: categoryId }
  }

  // 如果有子分类筛选
  if (subcategoryIds.length > 0) {
    where.categories = { in: subcategoryIds }
  }

  // 服务器端查询已筛选的产品
  const productsResult = await payload.find({
    collection: 'products',
    where,
    limit: 1000,
    depth: 1,
  })

  return (
    <ProductsCenter
      initialProducts={productsResult.docs}
      selectedCategoryId={categoryId}
      selectedSubcategoryIds={subcategoryIds}
    />
  )
}

