import React, { Suspense } from 'react'
import { ProductSearchResults } from '@/frontend/components'

export default function ProductSearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductSearchResults />
    </Suspense>
  )
}

