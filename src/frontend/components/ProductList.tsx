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
  const [selectedSubcategories, setSelectedSubcategories] = useState<Category[]>([])
  const [subcategoryCounts, setSubcategoryCounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)

  // Fetch product count for each subcategory
  const fetchSubcategoryCounts = useCallback(async () => {
    if (!mainCategory || !subcategories.length) return

    try {
      const counts: Record<number, number> = {}
      
      // Fetch count for each subcategory
      await Promise.all(
        subcategories.map(async (subcategory) => {
          try {
            const response = await fetch(
              `/api/products?where[and][0][mainCategory][equals]=${mainCategory.id}&where[and][1][categories][contains]=${subcategory.id}&limit=0&depth=0`
            )
            const data = (await response.json()) as { totalDocs?: number }
            counts[subcategory.id] = data.totalDocs || 0
          } catch (error) {
            console.error(`Error fetching count for subcategory ${subcategory.id}:`, error)
            counts[subcategory.id] = 0
          }
        })
      )
      
      setSubcategoryCounts(counts)
    } catch (error) {
      console.error('Error fetching subcategory counts:', error)
    }
  }, [mainCategory, subcategories])

  const fetchProducts = useCallback(async () => {
    if (!mainCategory) return

    try {
      setLoading(true)
      let url = `/api/products?where[mainCategory][equals]=${mainCategory.id}&limit=100&depth=1`

      // If subcategories are selected, filter by subcategories using OR logic
      if (selectedSubcategories.length > 0) {
        // Build OR query for multiple subcategories
        const orConditions = selectedSubcategories.map((subcategory, index) => ({
          [`categories[contains]`]: subcategory.id,
        }))
        
        // For Payload API, we need to use a different approach
        // Use 'in' operator if available, or build OR query
        if (selectedSubcategories.length === 1) {
          url = `/api/products?where[and][0][mainCategory][equals]=${mainCategory.id}&where[and][1][categories][contains]=${selectedSubcategories[0].id}&limit=100&depth=1`
        } else {
          // For multiple selections, we need to fetch all and filter client-side
          // Or use a more complex query structure
          const categoryIds = selectedSubcategories.map((sc) => sc.id).join(',')
          // Note: Payload may not support complex OR queries easily, so we'll fetch all and filter
          url = `/api/products?where[mainCategory][equals]=${mainCategory.id}&limit=1000&depth=1`
        }
      }

      const response = await fetch(url)
      const data = (await response.json()) as { docs?: Product[] }
      if (data.docs) {
        let filteredProducts = data.docs
        
        // If multiple subcategories selected, filter client-side
        if (selectedSubcategories.length > 1) {
          const selectedIds = new Set(selectedSubcategories.map((sc) => sc.id))
          filteredProducts = data.docs.filter((product) => {
            if (!product.categories || !Array.isArray(product.categories)) return false
            return product.categories.some((catId) => 
              typeof catId === 'number' ? selectedIds.has(catId) : selectedIds.has(Number(catId))
            )
          })
        }
        
        setProducts(filteredProducts)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [mainCategory, selectedSubcategories])

  // Fetch main category and subcategories
  useEffect(() => {
    if (categoryParam) {
      fetchCategoryData(Number(categoryParam))
    }
  }, [categoryParam])

  // Set selected subcategories from URL param
  useEffect(() => {
    if (subcategoryParam && subcategories.length > 0) {
      // Support comma-separated subcategory IDs for multiple selection
      const subcategoryIds = subcategoryParam.split(',').map((id) => Number(id.trim()))
      const selected = subcategories.filter((cat) => subcategoryIds.includes(cat.id))
      setSelectedSubcategories(selected)
    } else {
      setSelectedSubcategories([])
    }
  }, [subcategoryParam, subcategories])

  // Fetch subcategory counts when subcategories are loaded
  useEffect(() => {
    if (subcategories.length > 0 && mainCategory) {
      fetchSubcategoryCounts()
    }
  }, [subcategories, mainCategory, fetchSubcategoryCounts])

  // Fetch products when category or subcategories change
  useEffect(() => {
    if (mainCategory) {
      fetchProducts()
    }
  }, [mainCategory, selectedSubcategories, fetchProducts])

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

  const handleSubcategoryToggle = (subcategory: Category) => {
    const isSelected = selectedSubcategories.some((sc) => sc.id === subcategory.id)
    let newSelected: Category[]
    
    if (isSelected) {
      // Remove from selection
      newSelected = selectedSubcategories.filter((sc) => sc.id !== subcategory.id)
    } else {
      // Add to selection
      newSelected = [...selectedSubcategories, subcategory]
    }
    
    setSelectedSubcategories(newSelected)
    
    // Update URL
    if (newSelected.length === 0) {
      router.push(`/products/category?category=${mainCategory?.id}`, { scroll: false })
    } else {
      const subcategoryIds = newSelected.map((sc) => sc.id).join(',')
      router.push(`/products/category?category=${mainCategory?.id}&subcategory=${subcategoryIds}`, { scroll: false })
    }
  }

  const handleClearAll = () => {
    setSelectedSubcategories([])
    router.push(`/products/category?category=${mainCategory?.id}`, { scroll: false })
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
              {selectedSubcategories.length > 0 && (
                <button onClick={handleClearAll} className="product-list-view-all-button">
                  Clear All
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
                      {items.map((subcategory) => {
                        const isSelected = selectedSubcategories.some((sc) => sc.id === subcategory.id)
                        const count = subcategoryCounts[subcategory.id] || 0
                        return (
                          <label
                            key={subcategory.id}
                            className={`product-list-subcategory-item ${
                              isSelected ? 'active' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSubcategoryToggle(subcategory)}
                              style={{ marginRight: '8px', cursor: 'pointer' }}
                            />
                            <span>
                              {subcategory.name}
                              {count > 0 && <span className="product-list-subcategory-count"> ({count})</span>}
                            </span>
                          </label>
                        )
                      })}
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
                {selectedSubcategories.length > 0
                  ? selectedSubcategories.length === 1
                    ? `${selectedSubcategories[0].name} Products`
                    : `${selectedSubcategories.length} Selected Subcategories`
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

