import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Header } from '@/frontend/components'
import { CategoriesProvider } from '@/frontend/contexts/CategoriesContext'
import './styles.css'

// 动态渲染配置
export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'Professional Video Surveillance Equipment and Intelligent Security Solutions',
  title: 'IDView - Digital Video Recording Solutions',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  // 预加载导航所需的主分类数据（所有页面共享）
  const payload = await getPayload({ config })
  const categoriesResult = await payload.find({
    collection: 'categories',
    where: {
      type: { equals: 'product-category' },
      parent: { exists: false },
    },
    limit: 100,
    depth: 1,
  })

  // 预加载所有子分类（用于下拉菜单和页面使用）
  const allSubcategoriesResult = await payload.find({
    collection: 'categories',
    where: {
      parent: { exists: true },
    },
    limit: 1000,
    depth: 1,
  })

  return (
    <html lang="en">
      <body>
        <CategoriesProvider
          mainCategories={categoriesResult.docs}
          allSubcategories={allSubcategoriesResult.docs}
        >
          <Header />
          <main>{children}</main>
        </CategoriesProvider>
      </body>
    </html>
  )
}
