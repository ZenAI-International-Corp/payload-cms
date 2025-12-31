import React, { Suspense } from 'react'
import { ProductsCenter } from '@/frontend/components'

export default function ProductCategoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsCenter />
    </Suspense>
  )
}

