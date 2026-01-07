'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import type { Product, Category } from '@/payload-types'
import './ProductDetail.css'

type TabType = 'specification' | 'downloads' | 'related'

interface RelatedProductData {
  product: Product
  relationType: string
  note?: string
  direction: 'outgoing' | 'incoming'
}

interface ProductDetailProps {
  product: Product
  allCategories: Category[]
  galleryImages: { url: string; alt: string }[]
  description: string | null
  relatedProducts?: {
    // Direct relations (outgoing)
    accessories: RelatedProductData[]
    compatible: RelatedProductData[]
    alternatives: RelatedProductData[]
    upgrades: RelatedProductData[]
    related: RelatedProductData[]
    // Reverse relations (incoming)
    reverseAccessories: RelatedProductData[]
    reverseCompatible: RelatedProductData[]
    reverseAlternatives: RelatedProductData[]
    reverseUpgrades: RelatedProductData[]
    reverseRelated: RelatedProductData[]
  }
}

export function ProductDetail({
  product,
  allCategories,
  galleryImages,
  description,
  relatedProducts,
}: ProductDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('specification')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const currentImage = galleryImages[selectedImageIndex] || galleryImages[0]

  const mainCategoryId =
    typeof product.mainCategory === 'object' ? product.mainCategory?.id : product.mainCategory

  // Check if there are any related products
  const hasRelatedProducts = relatedProducts && (
    // Direct relations
    (relatedProducts.accessories?.length || 0) > 0 ||
    (relatedProducts.compatible?.length || 0) > 0 ||
    (relatedProducts.alternatives?.length || 0) > 0 ||
    (relatedProducts.upgrades?.length || 0) > 0 ||
    (relatedProducts.related?.length || 0) > 0 ||
    // Reverse relations
    (relatedProducts.reverseAccessories?.length || 0) > 0 ||
    (relatedProducts.reverseCompatible?.length || 0) > 0 ||
    (relatedProducts.reverseAlternatives?.length || 0) > 0 ||
    (relatedProducts.reverseUpgrades?.length || 0) > 0 ||
    (relatedProducts.reverseRelated?.length || 0) > 0
  )

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
          {hasRelatedProducts && (
            <button
              className={`product-detail-tab ${activeTab === 'related' ? 'active' : ''}`}
              onClick={() => setActiveTab('related')}
            >
              Related Products
            </button>
          )}
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

          {activeTab === 'related' && (
            <div className="product-detail-tab-content">
              {relatedProducts ? (
                <div className="product-detail-related">
                  {/* Accessories */}
                  {relatedProducts.accessories && relatedProducts.accessories.length > 0 && (
                    <div className="product-detail-related-section">
                      <h3 className="product-detail-related-title">Recommended Accessories</h3>
                      <div className="product-detail-related-grid">
                        {relatedProducts.accessories.map((relation, index) => {
                          const relProduct = relation.product
                          const featuredImage = relProduct.gallery?.[0]
                          const imageUrl = featuredImage && typeof featuredImage.image === 'object' 
                            ? featuredImage.image.url 
                            : null

                          return (
                            <Link
                              key={`accessory-${index}`}
                              href={`/products/${relProduct.slug}`}
                              className="product-detail-related-card"
                            >
                              {imageUrl && (
                                <div className="product-detail-related-image">
                                  <img src={imageUrl} alt={relProduct.model || 'Product'} />
                                </div>
                              )}
                              <div className="product-detail-related-info">
                                <h4>{relProduct.model}</h4>
                                {relProduct.description && (
                                  <p className="product-detail-related-description">
                                    {relProduct.description}
                                  </p>
                                )}
                                {relation.note && (
                                  <p className="product-detail-related-note">{relation.note}</p>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Compatible Products */}
                  {relatedProducts.compatible && relatedProducts.compatible.length > 0 && (
                    <div className="product-detail-related-section">
                      <h3 className="product-detail-related-title">Compatible Products</h3>
                      <div className="product-detail-related-grid">
                        {relatedProducts.compatible.map((relation, index) => {
                          const relProduct = relation.product
                          const featuredImage = relProduct.gallery?.[0]
                          const imageUrl = featuredImage && typeof featuredImage.image === 'object' 
                            ? featuredImage.image.url 
                            : null

                          return (
                            <Link
                              key={`compatible-${index}`}
                              href={`/products/${relProduct.slug}`}
                              className="product-detail-related-card"
                            >
                              {imageUrl && (
                                <div className="product-detail-related-image">
                                  <img src={imageUrl} alt={relProduct.model || 'Product'} />
                                </div>
                              )}
                              <div className="product-detail-related-info">
                                <h4>{relProduct.model}</h4>
                                {relProduct.description && (
                                  <p className="product-detail-related-description">
                                    {relProduct.description}
                                  </p>
                                )}
                                {relation.note && (
                                  <p className="product-detail-related-note">{relation.note}</p>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reverse Relations - Products that reference this product */}
                  
                  {/* Reverse: Accessory (Products that list this as accessory) */}
                  {relatedProducts.reverseAccessories && relatedProducts.reverseAccessories.length > 0 && (
                    <div className="product-detail-related-section">
                      <h3 className="product-detail-related-title">Compatible With</h3>
                      <p className="product-detail-related-subtitle">
                        This accessory is compatible with the following products:
                      </p>
                      <div className="product-detail-related-grid">
                        {relatedProducts.reverseAccessories.map((relation, index) => {
                          const relProduct = relation.product
                          const featuredImage = relProduct.gallery?.[0]
                          const imageUrl = featuredImage && typeof featuredImage.image === 'object' 
                            ? featuredImage.image.url 
                            : null

                          return (
                            <Link
                              key={`rev-accessory-${index}`}
                              href={`/products/${relProduct.slug}`}
                              className="product-detail-related-card"
                            >
                              {imageUrl && (
                                <div className="product-detail-related-image">
                                  <img src={imageUrl} alt={relProduct.model || 'Product'} />
                                </div>
                              )}
                              <div className="product-detail-related-info">
                                <h4>{relProduct.model}</h4>
                                {relProduct.description && (
                                  <p className="product-detail-related-description">
                                    {relProduct.description}
                                  </p>
                                )}
                                {relation.note && (
                                  <p className="product-detail-related-note">{relation.note}</p>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reverse: Compatible */}
                  {relatedProducts.reverseCompatible && relatedProducts.reverseCompatible.length > 0 && (
                    <div className="product-detail-related-section">
                      <h3 className="product-detail-related-title">Works With</h3>
                      <p className="product-detail-related-subtitle">
                        Products that are compatible with this product:
                      </p>
                      <div className="product-detail-related-grid">
                        {relatedProducts.reverseCompatible.map((relation, index) => {
                          const relProduct = relation.product
                          const featuredImage = relProduct.gallery?.[0]
                          const imageUrl = featuredImage && typeof featuredImage.image === 'object' 
                            ? featuredImage.image.url 
                            : null

                          return (
                            <Link
                              key={`rev-compatible-${index}`}
                              href={`/products/${relProduct.slug}`}
                              className="product-detail-related-card"
                            >
                              {imageUrl && (
                                <div className="product-detail-related-image">
                                  <img src={imageUrl} alt={relProduct.model || 'Product'} />
                                </div>
                              )}
                              <div className="product-detail-related-info">
                                <h4>{relProduct.model}</h4>
                                {relProduct.description && (
                                  <p className="product-detail-related-description">
                                    {relProduct.description}
                                  </p>
                                )}
                                {relation.note && (
                                  <p className="product-detail-related-note">{relation.note}</p>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reverse: Alternative */}
                  {relatedProducts.reverseAlternatives && relatedProducts.reverseAlternatives.length > 0 && (
                    <div className="product-detail-related-section">
                      <h3 className="product-detail-related-title">Alternative To</h3>
                      <p className="product-detail-related-subtitle">
                        This product is an alternative to:
                      </p>
                      <div className="product-detail-related-grid">
                        {relatedProducts.reverseAlternatives.map((relation, index) => {
                          const relProduct = relation.product
                          const featuredImage = relProduct.gallery?.[0]
                          const imageUrl = featuredImage && typeof featuredImage.image === 'object' 
                            ? featuredImage.image.url 
                            : null

                          return (
                            <Link
                              key={`rev-alternative-${index}`}
                              href={`/products/${relProduct.slug}`}
                              className="product-detail-related-card"
                            >
                              {imageUrl && (
                                <div className="product-detail-related-image">
                                  <img src={imageUrl} alt={relProduct.model || 'Product'} />
                                </div>
                              )}
                              <div className="product-detail-related-info">
                                <h4>{relProduct.model}</h4>
                                {relProduct.description && (
                                  <p className="product-detail-related-description">
                                    {relProduct.description}
                                  </p>
                                )}
                                {relation.note && (
                                  <p className="product-detail-related-note">{relation.note}</p>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reverse: Upgrade */}
                  {relatedProducts.reverseUpgrades && relatedProducts.reverseUpgrades.length > 0 && (
                    <div className="product-detail-related-section">
                      <h3 className="product-detail-related-title">Upgrade From</h3>
                      <p className="product-detail-related-subtitle">
                        This product is an upgrade from:
                      </p>
                      <div className="product-detail-related-grid">
                        {relatedProducts.reverseUpgrades.map((relation, index) => {
                          const relProduct = relation.product
                          const featuredImage = relProduct.gallery?.[0]
                          const imageUrl = featuredImage && typeof featuredImage.image === 'object' 
                            ? featuredImage.image.url 
                            : null

                          return (
                            <Link
                              key={`rev-upgrade-${index}`}
                              href={`/products/${relProduct.slug}`}
                              className="product-detail-related-card"
                            >
                              {imageUrl && (
                                <div className="product-detail-related-image">
                                  <img src={imageUrl} alt={relProduct.model || 'Product'} />
                                </div>
                              )}
                              <div className="product-detail-related-info">
                                <h4>{relProduct.model}</h4>
                                {relProduct.description && (
                                  <p className="product-detail-related-description">
                                    {relProduct.description}
                                  </p>
                                )}
                                {relation.note && (
                                  <p className="product-detail-related-note">{relation.note}</p>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reverse: Related (General) */}
                  {relatedProducts.reverseRelated && relatedProducts.reverseRelated.length > 0 && (
                    <div className="product-detail-related-section">
                      <h3 className="product-detail-related-title">Also Related To</h3>
                      <p className="product-detail-related-subtitle">
                        Products that are related to this product:
                      </p>
                      <div className="product-detail-related-grid">
                        {relatedProducts.reverseRelated.map((relation, index) => {
                          const relProduct = relation.product
                          const featuredImage = relProduct.gallery?.[0]
                          const imageUrl = featuredImage && typeof featuredImage.image === 'object' 
                            ? featuredImage.image.url 
                            : null

                          return (
                            <Link
                              key={`rev-related-${index}`}
                              href={`/products/${relProduct.slug}`}
                              className="product-detail-related-card"
                            >
                              {imageUrl && (
                                <div className="product-detail-related-image">
                                  <img src={imageUrl} alt={relProduct.model || 'Product'} />
                                </div>
                              )}
                              <div className="product-detail-related-info">
                                <h4>{relProduct.model}</h4>
                                {relProduct.description && (
                                  <p className="product-detail-related-description">
                                    {relProduct.description}
                                  </p>
                                )}
                                {relation.note && (
                                  <p className="product-detail-related-note">{relation.note}</p>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Alternatives */}
                  {relatedProducts.alternatives && relatedProducts.alternatives.length > 0 && (
                    <div className="product-detail-related-section">
                      <h3 className="product-detail-related-title">Alternative Products</h3>
                      <div className="product-detail-related-grid">
                        {relatedProducts.alternatives.map((relation, index) => {
                          const relProduct = relation.product
                          const featuredImage = relProduct.gallery?.[0]
                          const imageUrl = featuredImage && typeof featuredImage.image === 'object' 
                            ? featuredImage.image.url 
                            : null

                          return (
                            <Link
                              key={`alternative-${index}`}
                              href={`/products/${relProduct.slug}`}
                              className="product-detail-related-card"
                            >
                              {imageUrl && (
                                <div className="product-detail-related-image">
                                  <img src={imageUrl} alt={relProduct.model || 'Product'} />
                                </div>
                              )}
                              <div className="product-detail-related-info">
                                <h4>{relProduct.model}</h4>
                                {relProduct.description && (
                                  <p className="product-detail-related-description">
                                    {relProduct.description}
                                  </p>
                                )}
                                {relation.note && (
                                  <p className="product-detail-related-note">{relation.note}</p>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Upgrades */}
                  {relatedProducts.upgrades && relatedProducts.upgrades.length > 0 && (
                    <div className="product-detail-related-section">
                      <h3 className="product-detail-related-title">Upgrade Options</h3>
                      <div className="product-detail-related-grid">
                        {relatedProducts.upgrades.map((relation, index) => {
                          const relProduct = relation.product
                          const featuredImage = relProduct.gallery?.[0]
                          const imageUrl = featuredImage && typeof featuredImage.image === 'object' 
                            ? featuredImage.image.url 
                            : null

                          return (
                            <Link
                              key={`upgrade-${index}`}
                              href={`/products/${relProduct.slug}`}
                              className="product-detail-related-card"
                            >
                              {imageUrl && (
                                <div className="product-detail-related-image">
                                  <img src={imageUrl} alt={relProduct.model || 'Product'} />
                                </div>
                              )}
                              <div className="product-detail-related-info">
                                <h4>{relProduct.model}</h4>
                                {relProduct.description && (
                                  <p className="product-detail-related-description">
                                    {relProduct.description}
                                  </p>
                                )}
                                {relation.note && (
                                  <p className="product-detail-related-note">{relation.note}</p>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Related Products (General) */}
                  {relatedProducts.related && relatedProducts.related.length > 0 && (
                    <div className="product-detail-related-section">
                      <h3 className="product-detail-related-title">Related Products</h3>
                      <div className="product-detail-related-grid">
                        {relatedProducts.related.map((relation, index) => {
                          const relProduct = relation.product
                          const featuredImage = relProduct.gallery?.[0]
                          const imageUrl = featuredImage && typeof featuredImage.image === 'object' 
                            ? featuredImage.image.url 
                            : null

                          return (
                            <Link
                              key={`related-${index}`}
                              href={`/products/${relProduct.slug}`}
                              className="product-detail-related-card"
                            >
                              {imageUrl && (
                                <div className="product-detail-related-image">
                                  <img src={imageUrl} alt={relProduct.model || 'Product'} />
                                </div>
                              )}
                              <div className="product-detail-related-info">
                                <h4>{relProduct.model}</h4>
                                {relProduct.description && (
                                  <p className="product-detail-related-description">
                                    {relProduct.description}
                                  </p>
                                )}
                                {relation.note && (
                                  <p className="product-detail-related-note">{relation.note}</p>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="product-detail-empty">No related products available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

