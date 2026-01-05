'use client'

import React, { useState, useRef, useMemo, useEffect } from 'react'
import Link from 'next/link'
import type { Category } from '@/payload-types'
import { useCategories } from '@/frontend/contexts/CategoriesContext'
import './ProductsDropdown.css'

interface ProductsDropdownProps {
  isOpen: boolean
  onClose: () => void
  triggerRef: React.RefObject<HTMLElement>
}

export function ProductsDropdown({ 
  isOpen, 
  onClose, 
  triggerRef: _triggerRef,
}: ProductsDropdownProps) {
  const { mainCategories, allSubcategories } = useCategories()
  const [selectedCategory, setSelectedCategory] = useState<typeof mainCategories[0] | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 默认选中第一个分类
  useEffect(() => {
    if (mainCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(mainCategories[0])
    }
  }, [mainCategories, selectedCategory])

  // 根据选中的分类筛选子分类
  const subcategories = useMemo(() => {
    if (!selectedCategory) return []
    return allSubcategories.filter(cat => {
      const parentId = typeof cat.parent === 'object' ? cat.parent?.id : cat.parent
      return parentId === selectedCategory.id
    })
  }, [selectedCategory, allSubcategories])

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
            {mainCategories.map((category) => (
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
            ))}
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
              {Object.keys(groupedSubcategories).length > 0 ? (
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

