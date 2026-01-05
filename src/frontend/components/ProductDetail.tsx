'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import type { Product, Category } from '@/payload-types'
import './ProductDetail.css'

type TabType = 'specification' | 'downloads'

interface ProductDetailProps {
  product: Product
  allCategories: Category[]
  galleryImages: { url: string; alt: string }[]
  description: string | null
}

export function ProductDetail({
  product,
  allCategories,
  galleryImages,
  description,
}: ProductDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('specification')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const currentImage = galleryImages[selectedImageIndex] || galleryImages[0]

  const mainCategoryId =
    typeof product.mainCategory === 'object' ? product.mainCategory?.id : product.mainCategory

  // Render HTML content
  const renderHTML = (html: string | null | undefined) => {
    if (!html || typeof html !== 'string' || html.trim().length === 0) {
      return null
    }
    return <div className="product-detail-rich-text" dangerouslySetInnerHTML={{ __html: html }} />
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
                    const isMainCategory = category.id === mainCategoryId

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

            {/* Details Section */}
            <div className="product-detail-details-section">
              <h3>Details</h3>
              <div className="product-detail-details-content">
                {(() => {
                  const html = (product as any).details_html
                  const content = renderHTML(html)
                  return content || <p className="product-detail-empty">No details available.</p>
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
                const html = (product as any).specification_html
                const content = renderHTML(html)
                return content || <p className="product-detail-empty">No specification available.</p>
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

