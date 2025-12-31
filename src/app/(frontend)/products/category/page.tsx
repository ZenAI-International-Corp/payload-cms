import React, { Suspense } from 'react'
import { ProductList } from '@/frontend/components'

export default function ProductCategoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductList />
    </Suspense>
  )
}

