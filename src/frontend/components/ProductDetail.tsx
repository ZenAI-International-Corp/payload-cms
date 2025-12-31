'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Product, Category } from '@/payload-types'
import { PayloadLexicalReact } from '@zapal/payload-lexical-react'
import './ProductDetail.css'

type TabType = 'specification' | 'downloads'

export function ProductDetail() {
  const params = useParams()
  const slug = params?.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('specification')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    if (slug) {
      fetchProduct()
    }
  }, [slug])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      // Fetch product by slug
      const response = await fetch(`/api/products?where[slug][equals]=${slug}&limit=1&depth=2`)
      const data = (await response.json()) as { docs?: Product[] }

      if (data.docs && data.docs.length > 0) {
        const productData = data.docs[0]
        setProduct(productData)

        // Fetch all categories (main category + all subcategories)
        const categoryIdsToFetch = new Set<number>()

        // Add main category
        if (productData.mainCategory) {
          const mainCategoryId =
            typeof productData.mainCategory === 'object' ? productData.mainCategory.id : productData.mainCategory
          if (typeof mainCategoryId === 'number') {
            categoryIdsToFetch.add(mainCategoryId)
          }
        }

        // Add all categories from categories array (includes all subcategories)
        if (productData.categories && Array.isArray(productData.categories)) {
          productData.categories.forEach((cat) => {
            const catId = typeof cat === 'object' ? cat.id : cat
            if (typeof catId === 'number') {
              categoryIdsToFetch.add(catId)
            }
          })
        }

        // Fetch all categories
        if (categoryIdsToFetch.size > 0) {
          const categoryPromises = Array.from(categoryIdsToFetch).map(
            async (id): Promise<Category | null> => {
              try {
                const res = await fetch(`/api/categories/${id}?depth=0`)
                return (await res.json()) as Category
              } catch {
                return null
              }
            }
          )
          const fetchedCategories = await Promise.all(categoryPromises)
          const validCategories = fetchedCategories.filter((cat): cat is Category => cat !== null && cat.id !== undefined)
          
          // Sort: main category first, then subcategories
          const mainCategoryId =
            typeof productData.mainCategory === 'object'
              ? productData.mainCategory?.id
              : productData.mainCategory
          const sortedCategories = validCategories.sort((a, b) => {
            if (a.id === mainCategoryId) return -1
            if (b.id === mainCategoryId) return 1
            return 0
          })
          
          setAllCategories(sortedCategories)
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="product-detail">
        <div className="product-detail-loading">
          <p>Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-detail">
        <div className="product-detail-not-found">
          <p>Product not found</p>
          <Link href="/products" className="product-detail-back-link">
            ← Back to Products
          </Link>
        </div>
      </div>
    )
  }

  // Get gallery images
  const galleryImages =
    product.gallery && Array.isArray(product.gallery)
      ? product.gallery
          .map((item) => {
            if (item?.image && typeof item.image === 'object' && typeof item.image.url === 'string') {
              return {
                url: item.image.url,
                alt: item.alt || product.model || 'Product image',
              }
            }
            return null
          })
          .filter((img): img is { url: string; alt: string } => img !== null)
      : []

  const currentImage = galleryImages[selectedImageIndex] || galleryImages[0]

  // Get description
  const description =
    product.description && typeof product.description === 'string'
      ? product.description
      : product.description
        ? String(product.description)
        : null

  // Check if Lexical content is empty
  const isLexicalContentEmpty = (content: unknown): boolean => {
    if (!content || typeof content !== 'object' || content === null || !('root' in content)) {
      return true
    }

    const root = (content as { root?: { children?: unknown[] } }).root
    if (!root || !Array.isArray(root.children) || root.children.length === 0) {
      return true
    }

    // Check if all children are empty paragraphs or empty nodes
    const hasContent = root.children.some((child) => {
      if (typeof child !== 'object' || child === null) return false

      // If it's a paragraph, check if it has text content
      if ('type' in child && child.type === 'paragraph') {
        if ('children' in child && Array.isArray(child.children)) {
          return child.children.some(
            (textNode) =>
              typeof textNode === 'object' &&
              textNode !== null &&
              'type' in textNode &&
              textNode.type === 'text' &&
              'text' in textNode &&
              typeof textNode.text === 'string' &&
              textNode.text.trim().length > 0
          )
        }
        return false
      }

      // For other node types, consider them as having content
      return true
    })

    return !hasContent
  }

  // Render rich text content from Lexical editor
  const renderRichText = (content: unknown): React.ReactNode | null => {
    if (!content) return null
    // If it's a Lexical editor JSON, use PayloadLexicalReact
    if (typeof content === 'object' && content !== null && 'root' in content) {
      // Check if content is empty
      if (isLexicalContentEmpty(content)) {
        return null
      }
      try {
        return (
          <div className="product-detail-rich-text">
            <PayloadLexicalReact content={content as Parameters<typeof PayloadLexicalReact>[0]['content']} />
          </div>
        )
      } catch (error) {
        console.error('Error rendering Lexical content:', error)
        return null
      }
    }
    // Fallback for string content
    if (typeof content === 'string') {
      if (content.trim().length === 0) {
        return null
      }
      return <div dangerouslySetInnerHTML={{ __html: content }} />
    }
    return null
  }

  return (
    <div className="product-detail">
      <div className="product-detail-container">
        {/* Product Header Section */}
        <div className="product-detail-header">
          <div className="product-detail-images">
            {currentImage && (
              <div className="product-detail-main-image">
                <img src={currentImage.url} alt={currentImage.alt} />
              </div>
            )}
            {galleryImages.length > 1 && (
              <div className="product-detail-thumbnails">
                {galleryImages.map((img, index) => (
                  <button
                    key={index}
                    className={`product-detail-thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img src={img.url} alt={img.alt} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <h1 className="product-detail-title">{product.model}</h1>

            {description && (
              <div className="product-detail-description">
                <p>{description}</p>
              </div>
            )}

            <div className="product-detail-categories">
              <h3>Categories</h3>
              <div className="product-detail-categories-list">
                {allCategories.length > 0 ? (
                  allCategories.map((category) => {
                    const isMainCategory =
                      product.mainCategory &&
                      (typeof product.mainCategory === 'object'
                        ? product.mainCategory.id === category.id
                        : product.mainCategory === category.id)
                    const mainCategoryId =
                      product.mainCategory &&
                      (typeof product.mainCategory === 'object' ? product.mainCategory.id : product.mainCategory)

                    return (
                      <Link
                        key={category.id}
                        href={
                          isMainCategory
                            ? `/products/category?category=${category.id}`
                            : `/products/category?category=${mainCategoryId}&subcategory=${category.id}`
                        }
                        className={`product-detail-category-tag ${isMainCategory ? 'main' : ''}`}
                      >
                        {category.name}
                      </Link>
                    )
                  })
                ) : (
                  <span className="product-detail-category-empty">No categories</span>
                )}
              </div>
            </div>

            {/* Details Section - Moved here from tabbar */}
            <div className="product-detail-details-section">
              <h3>Details</h3>
              <div className="product-detail-details-content">
                {(() => {
                  const renderedContent = product.details ? renderRichText(product.details) : null
                  return renderedContent ? (
                    renderedContent
                  ) : (
                    <p className="product-detail-empty">No details available.</p>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="product-detail-tabs">
          <button
            className={`product-detail-tab ${activeTab === 'specification' ? 'active' : ''}`}
            onClick={() => setActiveTab('specification')}
          >
            Specification
          </button>
          <button
            className={`product-detail-tab ${activeTab === 'downloads' ? 'active' : ''}`}
            onClick={() => setActiveTab('downloads')}
          >
            Downloads
          </button>
        </div>

        {/* Tab Content */}
        <div className="product-detail-content">
          {activeTab === 'specification' && (
            <div className="product-detail-tab-content">
              {(() => {
                const renderedContent = product.specification ? renderRichText(product.specification) : null
                return renderedContent ? (
                  renderedContent
                ) : (
                  <p className="product-detail-empty">No specification available.</p>
                )
              })()}
            </div>
          )}

          {activeTab === 'downloads' && (
            <div className="product-detail-tab-content">
              {product.downloads && Array.isArray(product.downloads) && product.downloads.length > 0 ? (
                <div className="product-detail-downloads">
                  {product.downloads.map((download, index) => {
                    const file = download.file
                    const fileUrl =
                      file && typeof file === 'object' && typeof file.url === 'string' ? file.url : null

                    return (
                      <div key={index} className="product-detail-download-item">
                        <div className="product-detail-download-info">
                          <h4>{download.title}</h4>
                          {download.description && <p>{download.description}</p>}
                        </div>
                        {fileUrl && (
                          <a
                            href={fileUrl}
                            download
                            className="product-detail-download-button"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="product-detail-empty">No downloads available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

