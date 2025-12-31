import React, { Suspense } from 'react'
import { ProductsCenter } from '@/frontend/components'

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsCenter />
    </Suspense>
  )
}

