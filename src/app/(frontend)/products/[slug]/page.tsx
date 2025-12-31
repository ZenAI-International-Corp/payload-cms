import React, { Suspense } from 'react'
import { ProductDetail } from '@/frontend/components'

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductDetail />
    </Suspense>
  )
}

