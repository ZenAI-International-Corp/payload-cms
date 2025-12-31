'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Product, Media } from '@/payload-types'

interface ApiResponse {
  docs: Product[]
  totalDocs: number
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=4&depth=1&sort=-createdAt')
        const data = await response.json() as ApiResponse
        setProducts(data.docs || [])
      } catch (error) {
        console.error('Error fetching featured products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <section className="featured-section">
        <div className="container">
          <div className="section-header-inline">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <div className="section-underline"></div>
              <p className="section-description">
                Top-tier security equipment for critical applications.
              </p>
            </div>
            <Link href="/products" className="view-all-link">
              View All Products
              <ArrowRight className="arrow-icon" size={16} />
            </Link>
          </div>
          <div className="products-grid">
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
              Loading products...
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="featured-section">
      <div className="container">
        <div className="section-header-inline">
          <div>
            <h2 className="section-title">Featured Products</h2>
            <div className="section-underline"></div>
            <p className="section-description">
              Top-tier security equipment for critical applications.
            </p>
          </div>
          <Link href="/products" className="view-all-link">
            View All Products
            <ArrowRight className="arrow-icon" size={16} />
          </Link>
        </div>
        <div className="products-grid">
          {products.map((product: Product) => {
            // 获取产品的第一张图片作为特色图片
            const firstImage = product.gallery && product.gallery.length > 0 
              ? product.gallery[0].image 
              : null
            const imageUrl = firstImage && typeof firstImage === 'object'
              ? (firstImage as Media).url
              : 'https://placehold.co/537x460'
            
            // 获取主分类名称用作标签
            const categoryName = product.mainCategory && typeof product.mainCategory === 'object'
              ? product.mainCategory.name
              : ''
            
            // 判断是否为新产品（创建时间在 30 天内）
            const isNew = product.createdAt 
              ? new Date(product.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
              : false
            
            return (
              <div key={product.id} className="product-card">
                <div className="product-image-wrapper">
                  {isNew && <div className="product-badge">NEW</div>}
                  <img 
                    src={imageUrl || 'https://placehold.co/537x460'} 
                    alt={product.model} 
                    className="product-image" 
                  />
                </div>
                <div className="product-content">
                  <h3 className="product-name">{product.model}</h3>
                  <div className="product-tags">
                    {categoryName && (
                      <span className="product-tag">{categoryName}</span>
                    )}
                    {product.description && (
                      <span className="product-tag">
                        {product.description.length > 20 
                          ? product.description.substring(0, 20) + '...' 
                          : product.description}
                      </span>
                    )}
                  </div>
                  <Link href={`/products/${product.slug}`} className="product-link">
                    Learn More
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

