'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Category, Product } from '@/payload-types'
import { ProductCard } from './ProductCard'
import './ProductList.css'

export function ProductList() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const categoryParam = searchParams.get('category')
  const subcategoryParam = searchParams.get('subcategory')

  const [mainCategory, setMainCategory] = useState<Category | null>(null)
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedSubcategory, setSelectedSubcategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchProducts = useCallback(async () => {
    if (!mainCategory) return

    try {
      setLoading(true)
      let url = `/api/products?where[mainCategory][equals]=${mainCategory.id}&limit=100&depth=1`

      // If subcategory is selected, filter by subcategory in categories array
      if (selectedSubcategory) {
        // Use 'in' operator to check if subcategory is in the categories array
        url = `/api/products?where[and][0][mainCategory][equals]=${mainCategory.id}&where[and][1][categories][contains]=${selectedSubcategory.id}&limit=100&depth=1`
      }

      const response = await fetch(url)
      const data = (await response.json()) as { docs?: Product[] }
      if (data.docs) {
        setProducts(data.docs)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [mainCategory, selectedSubcategory])

  // Fetch main category and subcategories
  useEffect(() => {
    if (categoryParam) {
      fetchCategoryData(Number(categoryParam))
    }
  }, [categoryParam])

  // Set selected subcategory from URL param
  useEffect(() => {
    if (subcategoryParam && subcategories.length > 0) {
      const subcategory = subcategories.find((cat) => cat.id === Number(subcategoryParam))
      if (subcategory) {
        setSelectedSubcategory(subcategory)
      }
    } else {
      setSelectedSubcategory(null)
    }
  }, [subcategoryParam, subcategories])

  // Fetch products when category or subcategory changes
  useEffect(() => {
    if (mainCategory) {
      fetchProducts()
    }
  }, [mainCategory, selectedSubcategory, fetchProducts])

  const fetchCategoryData = async (categoryId: number) => {
    try {
      setLoading(true)
      // Fetch main category
      const categoryResponse = await fetch(`/api/categories/${categoryId}?depth=0`)
      const categoryData = (await categoryResponse.json()) as Category
      setMainCategory(categoryData)

      // Fetch subcategories
      const subcategoriesResponse = await fetch(
        `/api/categories?where[parent][equals]=${categoryId}&limit=100&depth=0`
      )
      const subcategoriesData = (await subcategoriesResponse.json()) as { docs?: Category[] }
      if (subcategoriesData.docs) {
        setSubcategories(subcategoriesData.docs)
      }
    } catch (error) {
      console.error('Error fetching category data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubcategoryClick = (subcategory: Category) => {
    setSelectedSubcategory(subcategory)
    router.push(`/products/category?category=${mainCategory?.id}&subcategory=${subcategory.id}`)
  }

  const handleViewAllClick = () => {
    setSelectedSubcategory(null)
    router.push(`/products/category?category=${mainCategory?.id}`)
  }

  // Group subcategories by type
  const groupedSubcategories = useMemo(() => {
    if (!subcategories.length) return {}

    const grouped: Record<string, Category[]> = {}
    subcategories.forEach((subcategory) => {
      const type = subcategory.type || 'other'
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(subcategory)
    })

    return grouped
  }, [subcategories])

  // Format type name for display
  const formatTypeName = (type: string): string => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (!mainCategory && !loading) {
    return (
      <div className="product-list">
        <div className="product-list-empty">
          <p>Category not found</p>
          <Link href="/products" className="product-list-back-link">
            ← Back to Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="product-list">
      <div className="product-list-header">
        <div className="product-list-header-content">
          <h1 className="product-list-title">{mainCategory?.name || 'Products'}</h1>
        </div>
      </div>

      <div className="product-list-container">
        <div className="product-list-left">
          <div className="product-list-subcategories">
            <div className="product-list-subcategories-header">
              <h2>Subcategories</h2>
              {selectedSubcategory && (
                <button onClick={handleViewAllClick} className="product-list-view-all-button">
                  View All
                </button>
              )}
            </div>
            {loading && subcategories.length === 0 ? (
              <div className="loading">Loading...</div>
            ) : Object.keys(groupedSubcategories).length > 0 ? (
              <div className="product-list-subcategories-grouped">
                {Object.entries(groupedSubcategories).map(([type, items]) => (
                  <div key={type} className="product-list-subcategory-group">
                    <h3 className="product-list-subcategory-group-title">{formatTypeName(type)}</h3>
                    <div className="product-list-subcategory-group-items">
                      {items.map((subcategory) => (
                        <button
                          key={subcategory.id}
                          onClick={() => handleSubcategoryClick(subcategory)}
                          className={`product-list-subcategory-item ${
                            selectedSubcategory?.id === subcategory.id ? 'active' : ''
                          }`}
                        >
                          {subcategory.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-subcategories">No subcategories available</div>
            )}
          </div>
        </div>

        <div className="product-list-right">
          <div className="product-list-products">
            <div className="product-list-products-header">
              <h2>
                {selectedSubcategory
                  ? `${selectedSubcategory.name} Products`
                  : `All ${mainCategory?.name} Products`}
              </h2>
              <p className="product-list-products-count">
                {products.length} product{products.length !== 1 ? 's' : ''}
              </p>
            </div>
            {loading && products.length === 0 ? (
              <div className="loading">Loading products...</div>
            ) : products.length > 0 ? (
              <div className="product-list-products-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="product-list-products-empty">
                <p>No products found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

