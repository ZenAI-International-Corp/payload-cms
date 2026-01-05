'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Category, Product } from '@/payload-types'
import { useCategories } from '@/frontend/contexts/CategoriesContext'
import { ProductCard } from './ProductCard'
import './ProductsCenter.css'

interface CategoryData {
  mainCategories: Category[]
  subcategories: Category[]
  products: Product[]
  subcategoryCounts: Record<number, number>
}

interface ProductsCenterProps {
  initialProducts: Product[]
}

export function ProductsCenter({
  initialProducts,
}: ProductsCenterProps) {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const subcategoryParam = searchParams.get('subcategory')
  const router = useRouter()
  const { mainCategories, allSubcategories } = useCategories()

  // 简化状态管理 - 使用 Context 中的分类数据
  const [data, setData] = useState<CategoryData>({
    mainCategories,
    subcategories: [],
    products: initialProducts,
    subcategoryCounts: {},
  })
  const [searchQuery, setSearchQuery] = useState('')
  
  const productsGridRef = useRef<HTMLDivElement>(null)

  // 从 URL 参数解析选中的分类
  const selectedCategoryId = categoryParam ? Number(categoryParam) : null
  const selectedSubcategoryIds = useMemo(() => {
    if (!subcategoryParam) return []
    return subcategoryParam.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id))
  }, [subcategoryParam])

  // 从数据中获取选中的分类对象
  const selectedCategory = useMemo(() => 
    data.mainCategories.find(cat => cat.id === selectedCategoryId) || null,
    [data.mainCategories, selectedCategoryId]
  )

  const selectedSubcategories = useMemo(() => 
    data.subcategories.filter(cat => selectedSubcategoryIds.includes(cat.id)),
    [data.subcategories, selectedSubcategoryIds]
  )

  // 基于初始数据进行客户端筛选（即时筛选，无需加载状态）
  const filterData = useCallback((categoryId: number | null, subcategoryIds: number[]) => {
    if (categoryId === null) {
      // "All" 模式 - 显示所有产品
      setData({
        mainCategories,
        subcategories: [],
        products: initialProducts,
        subcategoryCounts: {},
      })
    } else {
      // 筛选该分类下的子分类
      const subcategories = allSubcategories.filter(
        (cat) => {
          const parentId = typeof cat.parent === 'object' ? cat.parent?.id : cat.parent
          return parentId === categoryId
        }
      )

      // 筛选该分类下的产品
      const categoryProducts = initialProducts.filter((product) => {
        const mainCatId = typeof product.mainCategory === 'object' 
          ? product.mainCategory?.id 
          : product.mainCategory
        return mainCatId === categoryId
      })

      // 计算每个子分类的产品数量
      const subcategoryCounts: Record<number, number> = {}
      if (subcategories.length > 0) {
        subcategories.forEach((subcat) => {
          subcategoryCounts[subcat.id] = categoryProducts.filter((product) => {
            if (!product.categories || !Array.isArray(product.categories)) return false
            return product.categories.some(catId => {
              const id = typeof catId === 'object' ? catId.id : catId
              return id === subcat.id
            })
          }).length
        })
      }

      // 如果选中了子分类，进一步筛选产品
      let filteredProducts = categoryProducts
      if (subcategoryIds.length > 0) {
        const selectedIdsSet = new Set(subcategoryIds)
        filteredProducts = categoryProducts.filter((product) => {
          if (!product.categories || !Array.isArray(product.categories)) return false
          return product.categories.some(catId => {
            const id = typeof catId === 'object' ? catId.id : catId
            return selectedIdsSet.has(id)
          })
        })
      }

      setData({
        mainCategories,
        subcategories,
        products: filteredProducts,
        subcategoryCounts,
      })
    }
  }, [mainCategories, initialProducts, allSubcategories])

  // 当分类或子分类改变时重新筛选数据
  useEffect(() => {
    filterData(selectedCategoryId, selectedSubcategoryIds)
  }, [selectedCategoryId, selectedSubcategoryIds, filterData])

  // 分类点击处理
  const handleCategoryClick = useCallback((category: Category | null, e: React.MouseEvent) => {
    e.preventDefault()

    const newUrl = category ? `/products?category=${category.id}` : '/products'
    router.push(newUrl, { scroll: false })
    
    // 滚动到顶部
    if (productsGridRef.current) {
      productsGridRef.current.scrollTop = 0
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [router])

  // 子分类切换处理
  const handleSubcategoryToggle = useCallback((subcategory: Category) => {
    if (!selectedCategoryId) return

    const isSelected = selectedSubcategoryIds.includes(subcategory.id)
    const newIds = isSelected
      ? selectedSubcategoryIds.filter(id => id !== subcategory.id)
      : [...selectedSubcategoryIds, subcategory.id]

    const newUrl = newIds.length === 0
      ? `/products?category=${selectedCategoryId}`
      : `/products?category=${selectedCategoryId}&subcategory=${newIds.join(',')}`
    
    router.push(newUrl, { scroll: false })
  }, [selectedCategoryId, selectedSubcategoryIds, router])

  // 清除所有子分类过滤
  const handleClearAll = useCallback(() => {
    if (!selectedCategoryId) return
    router.push(`/products?category=${selectedCategoryId}`, { scroll: false })
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
    if (!data.subcategories.length) return {}

    const grouped: Record<string, Category[]> = {}
    data.subcategories.forEach((subcategory) => {
      const type = subcategory.type || 'other'
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(subcategory)
    })

    return grouped
  }, [data.subcategories])

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
            {data.mainCategories.map((category) => (
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
                    {data.products.length} product{data.products.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* 子分类过滤器 */}
                {selectedCategory && data.subcategories.length > 0 && Object.keys(groupedSubcategories).length > 0 && (
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
                              const count = data.subcategoryCounts[subcategory.id] || 0
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
                  {data.products.length > 0 ? (
                    <div 
                      className="products-center-products-grid" 
                      ref={productsGridRef}
                    >
                      {data.products.map((product) => (
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
