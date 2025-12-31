'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Category } from '@/payload-types'
import './ProductsCenter.css'

export function ProductsCenter() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const subcategoryParam = searchParams.get('subcategory')

  const router = useRouter()
  const [mainCategories, setMainCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchMainCategories = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories?where[type][equals]=product-category&where[parent][exists]=false&limit=100&depth=0')
      const data = (await response.json()) as { docs?: Category[] }
      if (data.docs) {
        setMainCategories(data.docs)
      }
    } catch (error) {
      console.error('Error fetching main categories:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch main categories on mount
  useEffect(() => {
    if (mainCategories.length === 0) {
      fetchMainCategories()
    }
  }, [mainCategories.length, fetchMainCategories])

  // Set selected category from URL param
  useEffect(() => {
    if (categoryParam && mainCategories.length > 0) {
      const category = mainCategories.find((cat) => cat.id === Number(categoryParam))
      if (category) {
        setSelectedCategory(category)
      }
    } else if (mainCategories.length > 0 && !selectedCategory) {
      // Select first category by default if no param
      setSelectedCategory(mainCategories[0])
    }
  }, [categoryParam, mainCategories, selectedCategory])

  // Fetch subcategories when a main category is selected
  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory.id)
    } else {
      setSubcategories([])
    }
  }, [selectedCategory])


  const fetchSubcategories = async (categoryId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/categories?where[parent][equals]=${categoryId}&limit=100&depth=0`)
      const data = (await response.json()) as { docs?: Category[] }
      if (data.docs) {
        setSubcategories(data.docs)
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (category: Category, e: React.MouseEvent) => {
    e.preventDefault()
    setSelectedCategory(category)
    // Update URL without navigation
    router.push(`/products?category=${category.id}`, { scroll: false })
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

  // Format type name for display (e.g., "input-type" -> "Input Type")
  const formatTypeName = (type: string): string => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
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
    <div className="products-center">
      <div className="products-center-header">
        <div className="products-center-header-content">
          <h1 className="products-center-title">Products Center</h1>
          <form onSubmit={handleSearch} className="products-center-search">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleInputChange}
              className="products-center-search-input"
            />
          </form>
        </div>
      </div>
      <div className="products-center-container">
        <div className="products-center-left">
          <div className="products-center-categories-list">
            <h2 className="categories-title">Categories</h2>
            {loading && mainCategories.length === 0 ? (
              <div className="loading">Loading...</div>
            ) : (
              mainCategories.map((category) => (
                <div
                  key={category.id}
                  className={`products-center-category-item ${selectedCategory?.id === category.id ? 'active' : ''}`}
                >
                  <Link
                    href={`/products?category=${category.id}`}
                    className="products-center-category-link"
                    onClick={(e) => handleCategoryClick(category, e)}
                  >
                    {category.name}
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="products-center-right">
          {selectedCategory ? (
            <div className="products-center-subcategories-panel">
              <div className="products-center-subcategories-header">
                <h1>{selectedCategory.name}</h1>
                <Link
                  href={`/products/category?category=${selectedCategory.id}`}
                  className="products-center-view-all-link"
                >
                  View All →
                </Link>
              </div>
              {loading && subcategories.length === 0 ? (
                <div className="loading">Loading subcategories...</div>
              ) : Object.keys(groupedSubcategories).length > 0 ? (
                <div className="products-center-subcategories-grouped">
                  {Object.entries(groupedSubcategories).map(([type, items]) => (
                    <div key={type} className="products-center-subcategory-group">
                      <h3 className="products-center-subcategory-group-title">{formatTypeName(type)}</h3>
                      <div className="products-center-subcategory-group-items">
                        {items.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            href={`/products/category?category=${selectedCategory.id}&subcategory=${subcategory.id}`}
                            className={`products-center-subcategory-item ${subcategoryParam && Number(subcategoryParam) === subcategory.id ? 'active' : ''}`}
                          >
                            <span className="products-center-subcategory-name">{subcategory.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-subcategories">No subcategories available</div>
              )}
            </div>
          ) : (
            <div className="products-center-placeholder">
              <p>Select a category to view subcategories</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

