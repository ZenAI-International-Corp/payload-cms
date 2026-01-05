'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Category, Product } from '@/payload-types'
import { useCategories } from '@/frontend/contexts/CategoriesContext'
import { ProductCard } from './ProductCard'
import './ProductsCenter.css'

interface ProductsCenterProps {
  initialProducts: Product[]
  selectedCategoryId: number | null
  selectedSubcategoryIds: number[]
}

export function ProductsCenter({
  initialProducts,
  selectedCategoryId,
  selectedSubcategoryIds,
}: ProductsCenterProps) {
  const router = useRouter()
  const { mainCategories, allSubcategories } = useCategories()
  const [searchQuery, setSearchQuery] = useState('')
  const productsGridRef = useRef<HTMLDivElement>(null)

  // 获取当前分类的子分类
  const subcategories = useMemo(() => {
    if (selectedCategoryId === null) return []
    return allSubcategories.filter(cat => {
      const parentId = typeof cat.parent === 'object' ? cat.parent?.id : cat.parent
      return parentId === selectedCategoryId
    })
  }, [selectedCategoryId, allSubcategories])

  // 获取选中的分类对象
  const selectedCategory = useMemo(() => 
    mainCategories.find(cat => cat.id === selectedCategoryId) || null,
    [mainCategories, selectedCategoryId]
  )

  const selectedSubcategories = useMemo(() => 
    subcategories.filter(cat => selectedSubcategoryIds.includes(cat.id)),
    [subcategories, selectedSubcategoryIds]
  )

  // 计算每个子分类的产品数量（用于显示计数）
  const subcategoryCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    subcategories.forEach((subcat) => {
      counts[subcat.id] = initialProducts.filter((product) => {
        if (!product.categories || !Array.isArray(product.categories)) return false
        return product.categories.some(catId => {
          const id = typeof catId === 'object' ? catId.id : catId
          return id === subcat.id
        })
      }).length
    })
    return counts
  }, [subcategories, initialProducts])

  // 分类点击处理 - 导航到新 URL，服务器端重新筛选数据
  const handleCategoryClick = useCallback((category: Category | null, e: React.MouseEvent) => {
    e.preventDefault()
    const newUrl = category ? `/products?category=${category.id}` : '/products'
    router.push(newUrl)
  }, [router])

  // 子分类切换处理 - 导航到新 URL，服务器端重新筛选数据
  const handleSubcategoryToggle = useCallback((subcategory: Category) => {
    if (!selectedCategoryId) return

    const isSelected = selectedSubcategoryIds.includes(subcategory.id)
    const newIds = isSelected
      ? selectedSubcategoryIds.filter(id => id !== subcategory.id)
      : [...selectedSubcategoryIds, subcategory.id]

    const newUrl = newIds.length === 0
      ? `/products?category=${selectedCategoryId}`
      : `/products?category=${selectedCategoryId}&subcategory=${newIds.join(',')}`
    
    router.push(newUrl)
  }, [selectedCategoryId, selectedSubcategoryIds, router])

  // 清除所有子分类过滤 - 导航回主分类页面
  const handleClearAll = useCallback(() => {
    if (!selectedCategoryId) return
    router.push(`/products?category=${selectedCategoryId}`)
  }, [selectedCategoryId, router])

  // 搜索处理
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }, [searchQuery, router])

  // 按类型分组子分类
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

  // 格式化类型名称
  const formatTypeName = (type: string): string => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="products-center-search-input"
            />
          </form>
        </div>
      </div>

      <div className="products-center-container">
        {/* 左侧分类列表 */}
        <div className="products-center-left">
          <div className="products-center-categories-list">
            <h2 className="categories-title">Categories</h2>
            {/* All 选项 */}
            <div className={`products-center-category-item ${selectedCategory === null ? 'active' : ''}`}>
              <Link
                href="/products"
                className="products-center-category-link"
                onClick={(e) => handleCategoryClick(null, e)}
              >
                All
              </Link>
            </div>
            {/* 分类列表 */}
            {mainCategories.map((category) => (
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
            ))}
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="products-center-right">
          <div className="products-center-content">
            <div className="products-center-content-wrapper">
              {/* 产品列表 */}
              <div className="products-center-products-section">
                <div className="products-center-products-header">
                  <h2>
                    {selectedCategory
                      ? selectedSubcategories.length > 0
                        ? selectedSubcategories.length === 1
                          ? `${selectedSubcategories[0].name} Products`
                          : `${selectedSubcategories.length} Selected Subcategories`
                        : `All ${selectedCategory.name} Products`
                      : 'All Products'}
                  </h2>
                  <p className="products-center-products-count">
                    {initialProducts.length} product{initialProducts.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* 子分类过滤器 */}
                {selectedCategory && subcategories.length > 0 && Object.keys(groupedSubcategories).length > 0 && (
                  <div className="products-center-subcategories-section">
                    <div className="products-center-subcategories-header">
                      <span className="products-center-subcategories-label">Filter:</span>
                      {selectedSubcategories.length > 0 && (
                        <button onClick={handleClearAll} className="products-center-clear-all-button">
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="products-center-subcategories-grouped">
                      {Object.entries(groupedSubcategories).map(([type, items]) => (
                        <div key={type} className="products-center-subcategory-group">
                          <span className="products-center-subcategory-group-title">{formatTypeName(type)}</span>
                          <div className="products-center-subcategory-group-items">
                            {items.map((subcategory) => {
                              const isSelected = selectedSubcategoryIds.includes(subcategory.id)
                              const count = subcategoryCounts[subcategory.id] || 0
                              return (
                                <label
                                  key={subcategory.id}
                                  className={`products-center-subcategory-item ${isSelected ? 'active' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSubcategoryToggle(subcategory)}
                                    style={{ marginRight: '6px', cursor: 'pointer' }}
                                  />
                                  <span>
                                    {subcategory.name}
                                    {count > 0 && <span className="products-center-subcategory-count"> ({count})</span>}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 产品网格 */}
                <div className="products-center-products-grid-wrapper">
                  {initialProducts.length > 0 ? (
                    <div 
                      className="products-center-products-grid" 
                      ref={productsGridRef}
                    >
                      {initialProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="products-center-products-empty">
                      <p>No products found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
