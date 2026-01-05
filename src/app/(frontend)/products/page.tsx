import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProductsCenter } from '@/frontend/components'

// 动态渲染配置
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // ISR: 1 hour

// 生成页面元数据
export const metadata = {
  title: 'Products - All Products',
  description: 'Browse all our products',
}

// 服务器组件 - 预加载产品数据（分类数据从 Context 获取）
export default async function ProductsPage() {
  const payload = await getPayload({ config })

  // 只需预加载所有产品，分类数据从 Context 获取
  const productsResult = await payload.find({
    collection: 'products',
    where: {
      status: { equals: 'visible' },
    },
    limit: 1000,
    depth: 1,
  })

  return (
    <ProductsCenter
      initialProducts={productsResult.docs}
    />
  )
}

