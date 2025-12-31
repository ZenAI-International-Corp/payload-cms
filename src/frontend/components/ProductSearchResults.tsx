'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Product } from '@/payload-types'
import { ProductCard } from './ProductCard'
import './ProductSearchResults.css'

export function ProductSearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState(query)

  // Fetch search results when query changes
  useEffect(() => {
    if (query) {
      searchProducts(query)
    } else {
      setProducts([])
    }
  }, [query])

  const searchProducts = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setProducts([])
      return
    }

    try {
      setLoading(true)
      // Search in model and slug fields using Payload API
      // Note: Hidden products are automatically filtered by access control
      const response = await fetch(
        `/api/products?where[or][0][model][contains]=${encodeURIComponent(searchTerm)}&where[or][1][slug][contains]=${encodeURIComponent(searchTerm)}&limit=50&depth=1`
      )
      const data = (await response.json()) as { docs?: Product[] }
      if (data.docs) {
        setProducts(data.docs)
      }
    } catch (error) {
      console.error('Error searching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="product-search-results">
      <div className="product-search-results-header">
        <div className="product-search-results-header-content">
          <h1 className="product-search-results-title">Search Results</h1>
          <form onSubmit={handleSearch} className="product-search-results-search">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleInputChange}
              className="product-search-results-search-input"
            />
            <button type="submit" className="product-search-results-search-button">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="product-search-results-container">
        {loading ? (
          <div className="product-search-results-loading">
            <p>Searching...</p>
          </div>
        ) : query ? (
          <>
            <div className="product-search-results-info">
              <p>
                Found <strong>{products.length}</strong> result{products.length !== 1 ? 's' : ''} for &quot;
                <strong>{query}</strong>&quot;
              </p>
            </div>
            {products.length > 0 ? (
              <div className="product-search-results-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="product-search-results-empty">
                <p>No products found matching your search.</p>
                <Link href="/products" className="product-search-results-back-link">
                  ← Back to Products
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="product-search-results-empty">
            <p>Enter a search term to find products.</p>
            <Link href="/products" className="product-search-results-back-link">
              ← Back to Products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

