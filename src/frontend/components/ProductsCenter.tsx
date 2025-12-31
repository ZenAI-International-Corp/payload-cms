'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Category, Product } from '@/payload-types'
import { ProductCard } from './ProductCard'
import './ProductsCenter.css'

interface CategoryData {
  mainCategories: Category[]
  subcategories: Category[]
  products: Product[]
  subcategoryCounts: Record<number, number>
}

interface ApiResponse<T> {
  docs?: T[]
  totalDocs?: number
}

export function ProductsCenter() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const subcategoryParam = searchParams.get('subcategory')
  const router = useRouter()

  // 简化状态管理
  const [data, setData] = useState<CategoryData>({
    mainCategories: [],
    subcategories: [],
    products: [],
    subcategoryCounts: {},
  })
  const [loading, setLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // 使用 AbortController 取消过期的请求
  const abortControllerRef = useRef<AbortController | null>(null)
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

  // 并行加载所有数据
  const loadData = useCallback(async (categoryId: number | null, subcategoryIds: number[]) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const controller = new AbortController()
    abortControllerRef.current = controller
    const signal = controller.signal

    try {
      setLoading(true)

      // 1. 首次加载或需要刷新主分类列表
      let mainCategories = data.mainCategories
      if (mainCategories.length === 0) {
        const mainCatResponse = await fetch(
          '/api/categories?where[type][equals]=product-category&where[parent][exists]=false&limit=100&depth=0',
          { signal }
        )
        if (!mainCatResponse.ok) throw new Error('Failed to fetch main categories')
        const mainCatData = await mainCatResponse.json() as ApiResponse<Category>
        mainCategories = mainCatData.docs || []
        if (signal.aborted) return
      }

      // 2. 根据选中的分类决定加载什么
      if (categoryId === null) {
        // "All" 模式 - 只加载产品
        const productsResponse = await fetch('/api/products?limit=100&depth=1', { signal })
        if (!productsResponse.ok) throw new Error('Failed to fetch products')
        const productsData = await productsResponse.json() as ApiResponse<Product>
        
        if (signal.aborted) return
        
        setData({
          mainCategories,
          subcategories: [],
          products: productsData.docs || [],
          subcategoryCounts: {},
        })
      } else {
        // 选中了特定分类 - 并行加载子分类和产品
        const [subcatResponse, productsResponse] = await Promise.all([
          fetch(`/api/categories?where[parent][equals]=${categoryId}&limit=100&depth=0`, { signal }),
          fetch(`/api/products?where[mainCategory][equals]=${categoryId}&limit=1000&depth=1`, { signal })
        ])

        if (!subcatResponse.ok || !productsResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const [subcatData, productsData] = await Promise.all([
          subcatResponse.json() as Promise<ApiResponse<Category>>,
          productsResponse.json() as Promise<ApiResponse<Product>>
        ])

        if (signal.aborted) return

        const subcategories = subcatData.docs || []
        const allProducts = productsData.docs || []

        // 3. 如果有子分类，计算每个子分类的产品数量（客户端计算，避免多次请求）
        const subcategoryCounts: Record<number, number> = {}
        if (subcategories.length > 0) {
          subcategories.forEach((subcat: Category) => {
            subcategoryCounts[subcat.id] = allProducts.filter((product: Product) => {
              if (!product.categories || !Array.isArray(product.categories)) return false
              return product.categories.some(catId => 
                (typeof catId === 'number' ? catId : Number(catId)) === subcat.id
              )
            }).length
          })
        }

        // 4. 过滤产品（如果选中了子分类）
        let filteredProducts = allProducts
        if (subcategoryIds.length > 0) {
          const selectedIdsSet = new Set(subcategoryIds)
          filteredProducts = allProducts.filter((product: Product) => {
            if (!product.categories || !Array.isArray(product.categories)) return false
            return product.categories.some(catId => 
              selectedIdsSet.has(typeof catId === 'number' ? catId : Number(catId))
            )
          })
        }

        if (signal.aborted) return

        setData({
          mainCategories,
          subcategories,
          products: filteredProducts,
          subcategoryCounts,
        })
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted')
        return
      }
      console.error('Error loading data:', error)
      // 出错时保持现有数据
    } finally {
      if (!signal.aborted) {
        setLoading(false)
      }
    }
  }, [data.mainCategories])

  // 快速过滤产品（不重新加载）
  const filterProducts = useCallback(async (categoryId: number, subcategoryIds: number[]) => {
    if (subcategoryIds.length === 0) {
      // 清除子分类过滤
      setFilterLoading(true)
      try {
        const response = await fetch(`/api/products?where[mainCategory][equals]=${categoryId}&limit=1000&depth=1`)
        if (!response.ok) throw new Error('Failed to fetch products')
        const productsData = await response.json() as ApiResponse<Product>
        
        setData(prev => ({
          ...prev,
          products: productsData.docs || []
        }))
      } catch (error) {
        console.error('Error filtering products:', error)
      } finally {
        setFilterLoading(false)
      }
    } else {
      // 使用已有数据进行客户端过滤
      setFilterLoading(true)
      // 使用 setTimeout 让 UI 有时间显示加载状态
      setTimeout(() => {
        const selectedIdsSet = new Set(subcategoryIds)
        const filteredProducts = data.products.filter((product: Product) => {
          if (!product.categories || !Array.isArray(product.categories)) {
            // 如果当前 products 已经是过滤后的，我们需要从完整列表过滤
            // 这里简化处理，直接返回 false
            return false
          }
          return product.categories.some(catId => 
            selectedIdsSet.has(typeof catId === 'number' ? catId : Number(catId))
          )
        })
        
        setData(prev => ({
          ...prev,
          products: filteredProducts
        }))
        setFilterLoading(false)
      }, 100)
    }
  }, [data.products])

  // 初始加载和分类切换
  useEffect(() => {
    loadData(selectedCategoryId, selectedSubcategoryIds)
  }, [selectedCategoryId]) // 只在分类 ID 改变时重新加载

  // 子分类过滤（快速）
  const previousSubcategoryIds = useRef<number[]>(selectedSubcategoryIds)
  useEffect(() => {
    // 检查子分类是否真的改变了
    const idsChanged = JSON.stringify(previousSubcategoryIds.current.sort()) !== 
                       JSON.stringify(selectedSubcategoryIds.sort())
    
    if (idsChanged && selectedCategoryId !== null && !loading) {
      filterProducts(selectedCategoryId, selectedSubcategoryIds)
      previousSubcategoryIds.current = selectedSubcategoryIds
    }
  }, [selectedSubcategoryIds, selectedCategoryId, loading, filterProducts])

  // 分类点击处理
  const handleCategoryClick = useCallback((category: Category | null, e: React.MouseEvent) => {
    e.preventDefault()
    if (loading) return

    const newUrl = category ? `/products?category=${category.id}` : '/products'
    router.push(newUrl, { scroll: false })
    
    // 滚动到顶部
    if (productsGridRef.current) {
      productsGridRef.current.scrollTop = 0
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [loading, router])

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
            {loading && data.mainCategories.length === 0 ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="products-center-right">
          <div className="products-center-content">
            <div className="products-center-content-wrapper">
              {/* 加载遮罩 */}
              {loading && (
                <div className="products-center-category-overlay">
                  <div className="products-center-category-spinner"></div>
                </div>
              )}

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
                {selectedCategory && !loading && data.subcategories.length > 0 && Object.keys(groupedSubcategories).length > 0 && (
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
                {loading && data.products.length === 0 ? (
                  <div className="loading">Loading products...</div>
                ) : (
                  <div className="products-center-products-grid-wrapper">
                    {filterLoading && (
                      <div className="products-center-filter-overlay">
                        <div className="products-center-filter-spinner"></div>
                      </div>
                    )}
                    {data.products.length > 0 ? (
                      <div 
                        className={`products-center-products-grid ${filterLoading ? 'filtering' : ''}`} 
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
