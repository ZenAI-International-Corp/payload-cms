/**
 * Examples of using product relationship utilities
 * 
 * This file demonstrates how to use the product relationship functions
 * in your frontend pages and API routes.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import {
  getAllRelatedProducts,
  getProductAccessories,
  getMainProductsForAccessory,
  getProductReferences,
} from './productRelations'

/**
 * Example 1: Display related products on a product detail page
 * 
 * Use this in your product detail page component
 * e.g., app/(frontend)/products/[slug]/page.tsx
 */
export async function exampleProductDetailPage(productSlug: string) {
  const payload = await getPayload({ config })

  // Get the product
  const products = await payload.find({
    collection: 'products',
    where: { slug: { equals: productSlug } },
    limit: 1,
  })

  if (products.docs.length === 0) {
    return { notFound: true }
  }

  const product = products.docs[0]

  // Get all related products (both direct and reverse relations)
  const relations = await getAllRelatedProducts(payload, product.id, true)

  return {
    product: relations.product,
    // Direct relations: products this product points to
    accessories: relations.directRelations.filter(r => r.relationType === 'accessory'),
    compatibleProducts: relations.directRelations.filter(r => r.relationType === 'compatible'),
    alternatives: relations.directRelations.filter(r => r.relationType === 'alternative'),
    // Reverse relations: products that point to this product
    mainProducts: relations.reverseRelations.filter(r => r.relationType === 'accessory'),
    compatibleWith: relations.reverseRelations.filter(r => r.relationType === 'compatible'),
  }
}

/**
 * Example 2: Get only accessories for a main product
 * 
 * Use this when you only need to show accessories
 */
export async function exampleGetAccessories(productId: string) {
  const payload = await getPayload({ config })
  
  const accessories = await getProductAccessories(payload, productId)
  
  console.log(`Found ${accessories.length} accessories`)
  return accessories
}

/**
 * Example 3: Get main products for an accessory
 * 
 * Use this when showing "Compatible with" section on accessory pages
 */
export async function exampleGetMainProducts(accessoryId: string) {
  const payload = await getPayload({ config })
  
  const mainProducts = await getMainProductsForAccessory(payload, accessoryId)
  
  console.log(`This accessory is compatible with ${mainProducts.length} main products`)
  return mainProducts
}

/**
 * Example 4: Get all products that reference a specific product
 * 
 * Use this for advanced queries
 */
export async function exampleGetReferences(productId: string) {
  const payload = await getPayload({ config })
  
  // Get all products that reference this product
  const allReferences = await getProductReferences(payload, productId)
  
  // Get only products that list this as an accessory
  const accessoryReferences = await getProductReferences(payload, productId, 'accessory')
  
  return {
    allReferences,
    accessoryReferences,
  }
}

/**
 * Example 5: React component usage (Server Component)
 */
export async function ProductRelationsComponent({ productId }: { productId: string }) {
  const payload = await getPayload({ config })
  const relations = await getAllRelatedProducts(payload, productId, true)

  return {
    jsx: `
    <div className="product-relations">
      {/* Show accessories */}
      {relations.directRelations.filter(r => r.relationType === 'accessory').length > 0 && (
        <section className="accessories">
          <h2>Accessories</h2>
          <div className="products-grid">
            {relations.directRelations
              .filter(r => r.relationType === 'accessory')
              .map((relation) => {
                const product = relation.product as Product
                return (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    note={relation.note}
                  />
                )
              })}
          </div>
        </section>
      )}

      {/* Show main products (reverse relation) */}
      {relations.reverseRelations.filter(r => r.relationType === 'accessory').length > 0 && (
        <section className="compatible-with">
          <h2>Compatible With</h2>
          <div className="products-grid">
            {relations.reverseRelations
              .filter(r => r.relationType === 'accessory')
              .map((relation) => (
                <ProductCard 
                  key={relation.product.id} 
                  product={relation.product}
                  note={relation.note}
                />
              ))}
          </div>
        </section>
      )}

      {/* Show alternative products */}
      {relations.directRelations.filter(r => r.relationType === 'alternative').length > 0 && (
        <section className="alternatives">
          <h2>Alternative Products</h2>
          <div className="products-grid">
            {relations.directRelations
              .filter(r => r.relationType === 'alternative')
              .map((relation) => {
                const product = relation.product as Product
                return (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    note={relation.note}
                  />
                )
              })}
          </div>
        </section>
      )}
    </div>
    `,
  }
}

/**
 * Example 6: API Route usage
 */
export async function exampleAPIRoute(productId: string) {
  const payload = await getPayload({ config })
  
  try {
    const relations = await getAllRelatedProducts(payload, productId, true)
    
    return {
      success: true,
      data: {
        product: relations.product,
        accessories: relations.directRelations.filter(r => r.relationType === 'accessory'),
        mainProducts: relations.reverseRelations.filter(r => r.relationType === 'accessory'),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch product relations',
    }
  }
}

