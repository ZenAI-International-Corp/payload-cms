'use client'

import React from 'react'
import Link from 'next/link'
import type { Product } from '@/payload-types'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl =
    product.gallery &&
    Array.isArray(product.gallery) &&
    product.gallery.length > 0 &&
    product.gallery[0]?.image &&
    typeof product.gallery[0].image === 'object' &&
    typeof product.gallery[0].image.url === 'string'
      ? product.gallery[0].image.url
      : '/placeholder.png'

  const imageAlt =
    (product.gallery &&
      Array.isArray(product.gallery) &&
      product.gallery.length > 0 &&
      product.gallery[0]?.alt) ||
    product.model ||
    'Product image'

  const description =
    product.description && typeof product.description === 'string'
      ? product.description
      : product.description
        ? String(product.description)
        : null

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="product-card"
    >
      {product.gallery &&
        Array.isArray(product.gallery) &&
        product.gallery.length > 0 &&
        product.gallery[0]?.image && (
          <div className="product-card-image">
            <img src={imageUrl} alt={imageAlt} />
          </div>
        )}
      <div className="product-card-content">
        <h3 className="product-card-title">{product.model}</h3>
        {description && (
          <p className="product-card-description">{description}</p>
        )}
      </div>
    </Link>
  )
}

