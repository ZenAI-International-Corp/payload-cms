'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef, startTransition } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Category, Product } from '@/payload-types'
import { ProductCard } from './ProductCard'
import './ProductsCenter.css'

export function ProductsCenter() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const subcategoryParam = searchParams.get('subcategory')

  const router = useRouter()
  const [mainCategories, setMainCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedSubcategories, setSelectedSubcategories] = useState<Category[]>([])
  const [subcategoryCounts, setSubcategoryCounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [filterLoading, setFilterLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)
  const categoryChangeRef = useRef(false)
  const productsGridRef = useRef<HTMLDivElement>(null)
  // Track loading states for all required data
  const subcategoriesLoadedRef = useRef(false)
  const productsLoadedRef = useRef(false)
  const subcategoryCountsLoadedRef = useRef(false)

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

  // Fetch main categories on mount and trigger initial load
  useEffect(() => {
    if (mainCategories.length === 0) {
      fetchMainCategories()
      // Mark as category change to trigger proper loading flow
      categoryChangeRef.current = true
      setCategoryLoading(true)
      // Set "All" as default - products will be loaded by useEffect
      subcategoriesLoadedRef.current = true // No subcategories for "All"
      subcategoryCountsLoadedRef.current = true // No counts for "All"
    }
  }, [mainCategories.length, fetchMainCategories])

  // Set selected category from URL param
  useEffect(() => {
    if (categoryParam && mainCategories.length > 0) {
      const category = mainCategories.find((cat) => cat.id === Number(categoryParam))
      if (category && selectedCategory?.id !== category.id) {
        // Only update if category actually changed
        categoryChangeRef.current = true
        setCategoryLoading(true)
        setSelectedSubcategories([])
        setSelectedCategory(category)
      }
    } else if (mainCategories.length > 0 && selectedCategory !== null && categoryParam === null) {
      // Switching to "All" from URL
      categoryChangeRef.current = true
      setSelectedSubcategories([])
      setCategoryLoading(true)
      startTransition(() => {
        setSelectedCategory(null)
      })
    }
  }, [categoryParam, mainCategories, selectedCategory])

  // Fetch subcategories when a main category is selected
  useEffect(() => {
    if (selectedCategory) {
      // Don't set loading here - it's already set in handleCategoryClick
      fetchSubcategories(selectedCategory.id)
    } else {
      // Clear all data when switching to "All"
      setSubcategories([])
      setSelectedSubcategories([])
      setSubcategoryCounts({})
      // Reset loading flags for "All" category
      subcategoriesLoadedRef.current = true // No subcategories needed
      subcategoryCountsLoadedRef.current = true // No counts needed
      // Products will be loaded and will trigger checkAllDataLoaded
    }
  }, [selectedCategory])

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

  // Check if all required data is loaded
  const checkAllDataLoaded = useCallback(() => {
    if (!categoryChangeRef.current) return
    
    // If "All" is selected, only need products
    if (!selectedCategory) {
      if (productsLoadedRef.current) {
        categoryChangeRef.current = false
        requestAnimationFrame(() => {
          setCategoryLoading(false)
          setInitialLoading(false)
          // Smart scroll: only scroll to top if user scrolled significantly
          // or if we have very few products
          if (productsGridRef.current) {
            const scrollTop = productsGridRef.current.scrollTop
            const shouldResetScroll = scrollTop > 500 || products.length < 6
            if (shouldResetScroll) {
              productsGridRef.current.scrollTop = 0
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }
        })
      }
      return
    }
    
    // If category is selected, need subcategories, products, and counts
    const needsSubcategories = true // Always check subcategories for categories
    const needsCounts = subcategories.length > 0 // Only need counts if there are subcategories
    
    const subcategoriesReady = !needsSubcategories || subcategoriesLoadedRef.current
    const productsReady = productsLoadedRef.current
    const countsReady = !needsCounts || subcategoryCountsLoadedRef.current
    
    if (subcategoriesReady && productsReady && countsReady) {
      categoryChangeRef.current = false
      requestAnimationFrame(() => {
        setCategoryLoading(false)
        setInitialLoading(false)
        // Smart scroll: only scroll to top if user scrolled significantly
        // or if we have very few products
        if (productsGridRef.current) {
          const scrollTop = productsGridRef.current.scrollTop
          const shouldResetScroll = scrollTop > 500 || products.length < 6
          if (shouldResetScroll) {
            productsGridRef.current.scrollTop = 0
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }
      })
    }
  }, [selectedCategory, subcategories.length, products.length])

  const fetchSubcategories = async (categoryId: number) => {
    try {
      setLoading(true)
      subcategoriesLoadedRef.current = false
      const response = await fetch(`/api/categories?where[parent][equals]=${categoryId}&limit=100&depth=0`)
      const data = (await response.json()) as { docs?: Category[] }
      if (data.docs) {
        setSubcategories(data.docs)
      } else {
        setSubcategories([])
      }
      // Clear counts after setting new subcategories
      setSubcategoryCounts({})
      subcategoriesLoadedRef.current = true
      // Check if all data is loaded
      checkAllDataLoaded()
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      setSubcategories([])
      subcategoriesLoadedRef.current = true
      checkAllDataLoaded()
    } finally {
      setLoading(false)
    }
  }

  // Fetch product count for each subcategory
  const fetchSubcategoryCounts = useCallback(async () => {
    if (!selectedCategory || !subcategories.length) {
      subcategoryCountsLoadedRef.current = true
      checkAllDataLoaded()
      return
    }

    try {
      subcategoryCountsLoadedRef.current = false
      const counts: Record<number, number> = {}
      
      // Fetch count for each subcategory
      await Promise.all(
        subcategories.map(async (subcategory) => {
          try {
            const response = await fetch(
              `/api/products?where[and][0][mainCategory][equals]=${selectedCategory.id}&where[and][1][categories][contains]=${subcategory.id}&limit=0&depth=0`
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
      subcategoryCountsLoadedRef.current = true
      checkAllDataLoaded()
    } catch (error) {
      console.error('Error fetching subcategory counts:', error)
      subcategoryCountsLoadedRef.current = true
      checkAllDataLoaded()
    }
  }, [selectedCategory, subcategories, checkAllDataLoaded])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    const isCategoryChange = categoryChangeRef.current
    
    try {
      // Mark loading state but DON'T clear products
      if (isCategoryChange) {
        productsLoadedRef.current = false
      } else {
        // Filtering by subcategory - show overlay
        setFilterLoading(true)
      }
      
      let url: string

      // If "All" is selected (selectedCategory is null), fetch all products
      if (!selectedCategory) {
        url = `/api/products?limit=100&depth=1`
      } else {
        url = `/api/products?where[mainCategory][equals]=${selectedCategory.id}&limit=100&depth=1`

        // If subcategories are selected, filter by subcategories
        if (selectedSubcategories.length > 0) {
          if (selectedSubcategories.length === 1) {
            url = `/api/products?where[and][0][mainCategory][equals]=${selectedCategory.id}&where[and][1][categories][contains]=${selectedSubcategories[0].id}&limit=100&depth=1`
          } else {
            // For multiple selections, fetch all and filter client-side
            url = `/api/products?where[mainCategory][equals]=${selectedCategory.id}&limit=1000&depth=1`
          }
        }
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = (await response.json()) as { docs?: Product[] }
      if (data.docs) {
        let filteredProducts = data.docs
        
        // If multiple subcategories selected, filter client-side
        if (selectedCategory && selectedSubcategories.length > 1) {
          const selectedIds = new Set(selectedSubcategories.map((sc) => sc.id))
          filteredProducts = data.docs.filter((product) => {
            if (!product.categories || !Array.isArray(product.categories)) return false
            return product.categories.some((catId) => 
              typeof catId === 'number' ? selectedIds.has(catId) : selectedIds.has(Number(catId))
            )
          })
        }
        
        setProducts(filteredProducts)
      } else {
        setProducts([])
      }
      
      if (isCategoryChange) {
        productsLoadedRef.current = true
        checkAllDataLoaded()
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      // On error, keep old products visible but mark as loaded
      if (isCategoryChange) {
        productsLoadedRef.current = true
        checkAllDataLoaded()
      }
    } finally {
      // Always clean up loading states
      if (!isCategoryChange) {
        setFilterLoading(false)
      }
      // Category loading will be cleared by checkAllDataLoaded
    }
  }, [selectedCategory, selectedSubcategories, checkAllDataLoaded])

  // Fetch subcategory counts when subcategories are loaded
  useEffect(() => {
    if (subcategories.length > 0 && selectedCategory) {
      fetchSubcategoryCounts()
    }
  }, [subcategories, selectedCategory, fetchSubcategoryCounts])

  // Fetch products when category or subcategories change
  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, selectedSubcategories, fetchProducts])

  const handleCategoryClick = (category: Category | null, e: React.MouseEvent) => {
    e.preventDefault()
    
    // Prevent multiple clicks during loading
    if (categoryLoading) return
    
    // Mark that we're changing categories
    categoryChangeRef.current = true
    
    // DON'T clear data immediately - keep old content visible with overlay
    // Only clear selection states
    setSelectedSubcategories([])
    
    // Set loading state to show category overlay
    setCategoryLoading(true)
    
    // Set new category in a transition (non-urgent update)
    startTransition(() => {
      setSelectedCategory(category)
    })
    
    // Update URL without navigation
    if (category) {
      router.push(`/products?category=${category.id}`, { scroll: false })
    } else {
      router.push(`/products`, { scroll: false })
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
      router.push(`/products?category=${selectedCategory?.id}`, { scroll: false })
    } else {
      const subcategoryIds = newSelected.map((sc) => sc.id).join(',')
      router.push(`/products?category=${selectedCategory?.id}&subcategory=${subcategoryIds}`, { scroll: false })
    }
  }

  const handleClearAll = () => {
    setSelectedSubcategories([])
    router.push(`/products?category=${selectedCategory?.id}`, { scroll: false })
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
              <>
                {/* All option */}
                <div
                  className={`products-center-category-item ${selectedCategory === null ? 'active' : ''}`}
                >
                  <Link
                    href="/products"
                    className="products-center-category-link"
                    onClick={(e) => handleCategoryClick(null, e)}
                  >
                    All
                  </Link>
                </div>
                {/* Category list */}
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
              </>
            )}
          </div>
        </div>
        <div className="products-center-right">
          <div className="products-center-content">
            <div className="products-center-content-wrapper">
              {/* Category loading overlay */}
              {categoryLoading && (
                <div className="products-center-category-overlay">
                  <div className="products-center-category-spinner"></div>
                </div>
              )}
              <>
                {/* Products List */}
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
                      {products.length} product{products.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Subcategories Selector - only show when a category is selected, loaded, and has subcategories */}
                  {selectedCategory && !categoryLoading && !loading && subcategories.length > 0 && Object.keys(groupedSubcategories).length > 0 && (
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
                                const isSelected = selectedSubcategories.some((sc) => sc.id === subcategory.id)
                                const count = subcategoryCounts[subcategory.id] || 0
                                return (
                                  <label
                                    key={subcategory.id}
                                    className={`products-center-subcategory-item ${
                                      isSelected ? 'active' : ''
                                    }`}
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
                  {initialLoading && products.length === 0 ? (
                    <div className="loading">Loading products...</div>
                  ) : (
                    <div className="products-center-products-grid-wrapper">
                      {filterLoading && (
                        <div className="products-center-filter-overlay">
                          <div className="products-center-filter-spinner"></div>
                        </div>
                      )}
                      {products.length > 0 ? (
                        <div className={`products-center-products-grid ${filterLoading ? 'filtering' : ''}`} ref={productsGridRef}>
                          {products.map((product) => (
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
              </>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

