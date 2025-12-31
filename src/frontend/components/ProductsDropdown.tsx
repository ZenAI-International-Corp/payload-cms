'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { Category } from '@/payload-types'
import './ProductsDropdown.css'

interface ProductsDropdownProps {
  isOpen: boolean
  onClose: () => void
  triggerRef: React.RefObject<HTMLElement>
}

export function ProductsDropdown({ isOpen, onClose, triggerRef: _triggerRef }: ProductsDropdownProps) {
  const [mainCategories, setMainCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // Fetch main categories on mount (preload)
  useEffect(() => {
    if (mainCategories.length === 0) {
      fetchMainCategories()
    }
  }, [mainCategories.length, fetchMainCategories])

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

  const handleCategoryHover = (category: Category) => {
    setSelectedCategory(category)
  }

  const handleCategoryLeave = () => {
    // Don't clear immediately, allow user to move to subcategories
  }

  // Group subcategories by type
  const groupedSubcategories = React.useMemo(() => {
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

  return (
    <div className={`products-dropdown ${isOpen ? 'open' : 'closed'}`} ref={dropdownRef}>
      <div className="dropdown-container">
        <div className="dropdown-left">
          <div className="categories-list">
            {loading && mainCategories.length === 0 ? (
              <div className="loading">Loading...</div>
            ) : (
              mainCategories.map((category) => (
                <div
                  key={category.id}
                  className={`category-item ${selectedCategory?.id === category.id ? 'active' : ''}`}
                  onMouseEnter={() => handleCategoryHover(category)}
                  onMouseLeave={handleCategoryLeave}
                >
                  <Link
                    href={`/products/category?category=${category.id}`}
                    className="category-link"
                    onClick={onClose}
                  >
                    {category.name}
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="dropdown-right">
          {selectedCategory && (
            <div className="subcategories-panel">
              <div className="subcategories-header">
                <h3>{selectedCategory.name}</h3>
                <Link
                  href={`/products/category?category=${selectedCategory.id}`}
                  className="view-all-link"
                  onClick={onClose}
                >
                  View All →
                </Link>
              </div>
              {loading && subcategories.length === 0 ? (
                <div className="loading">Loading subcategories...</div>
              ) : Object.keys(groupedSubcategories).length > 0 ? (
                <div className="subcategories-grouped">
                  {Object.entries(groupedSubcategories).map(([type, items]) => (
                    <div key={type} className="subcategory-group">
                      <h4 className="subcategory-group-title">{formatTypeName(type)}</h4>
                      <div className="subcategory-group-items">
                        {items.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            href={`/products/category?category=${selectedCategory.id}&subcategory=${subcategory.id}`}
                            className="subcategory-item"
                            onClick={onClose}
                          >
                            <span className="subcategory-name">{subcategory.name}</span>
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
          )}
        </div>
      </div>
    </div>
  )
}

