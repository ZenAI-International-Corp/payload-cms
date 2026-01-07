import type { Payload } from 'payload'
import type { Product } from '@/payload-types'

/**
 * Product relationship utilities
 */

export interface RelatedProductWithType {
  product: Product | string | number
  relationType: 'accessory' | 'compatible' | 'alternative' | 'upgrade' | 'related'
  note?: string
}

/**
 * Get all products that reference the given product (reverse lookup)
 * 
 * Example: If product B has product A in its relatedProducts,
 * calling this with productId = A will return product B
 * 
 * @param payload - Payload instance
 * @param productId - The product ID to find references to
 * @param relationType - Optional: filter by relationship type
 * @returns Array of products that reference this product, with their relationship info
 */
export async function getProductReferences(
  payload: Payload,
  productId: string | number,
  relationType?: string,
): Promise<Array<{ product: Product; relationType: string; note?: string }>> {
  // Query products where relatedProducts.product equals the given productId
  const result = await payload.find({
    collection: 'products',
    where: {
      'relatedProducts.product': { equals: productId },
    },
    depth: 2,
  })

  // Extract and format the relationships
  const references: Array<{ product: Product; relationType: string; note?: string }> = []

  for (const product of result.docs) {
    if (product.relatedProducts && Array.isArray(product.relatedProducts)) {
      for (const relation of product.relatedProducts) {
        // Check if this relation points to our target product
        const relationProductId = typeof relation.product === 'object' 
          ? relation.product.id 
          : relation.product

        if (relationProductId === productId) {
          // Filter by relationType if specified
          if (!relationType || relation.relationType === relationType) {
            references.push({
              product: product as Product,
              relationType: relation.relationType || 'related',
              note: relation.note,
            })
          }
        }
      }
    }
  }

  return references
}

/**
 * Get all related products for a given product
 * Combines both direct relations and reverse relations
 * 
 * @param payload - Payload instance
 * @param productId - The product ID
 * @param includeReverse - Whether to include reverse relations (products that reference this one)
 * @returns Object with direct and reverse relations
 */
export async function getAllRelatedProducts(
  payload: Payload,
  productId: string | number,
  includeReverse: boolean = true,
) {
  // Get the product with its direct relations
  const product = await payload.findByID({
    collection: 'products',
    id: productId,
    depth: 2,
  })

  // Format direct relations
  const directRelations = (product.relatedProducts || []).map((rel: any) => ({
    product: rel.product,
    relationType: rel.relationType || 'related',
    note: rel.note,
    direction: 'outgoing' as const,
  }))

  // Get reverse relations if requested
  let reverseRelations: Array<{
    product: Product
    relationType: string
    note?: string
    direction: 'incoming'
  }> = []

  if (includeReverse) {
    const references = await getProductReferences(payload, productId)
    reverseRelations = references.map(ref => ({
      ...ref,
      direction: 'incoming' as const,
    }))
  }

  return {
    product,
    directRelations,
    reverseRelations,
    allRelations: [...directRelations, ...reverseRelations],
  }
}

/**
 * Get accessories for a main product
 * Returns both:
 * 1. Products this product lists as accessories
 * 2. Products that list this product as their main product (reverse lookup)
 * 
 * @param payload - Payload instance
 * @param productId - The main product ID
 * @returns Array of accessory products
 */
export async function getProductAccessories(
  payload: Payload,
  productId: string | number,
): Promise<Product[]> {
  const product = await payload.findByID({
    collection: 'products',
    id: productId,
    depth: 2,
  })

  const accessories: Product[] = []

  // Get direct accessories (this product -> accessory)
  if (product.relatedProducts && Array.isArray(product.relatedProducts)) {
    for (const relation of product.relatedProducts) {
      if (relation.relationType === 'accessory' && typeof relation.product === 'object') {
        accessories.push(relation.product as Product)
      }
    }
  }

  return accessories
}

/**
 * Get main products for an accessory
 * Returns products where this product is listed as an accessory
 * 
 * @param payload - Payload instance
 * @param accessoryId - The accessory product ID
 * @returns Array of main products
 */
export async function getMainProductsForAccessory(
  payload: Payload,
  accessoryId: string | number,
): Promise<Product[]> {
  const references = await getProductReferences(payload, accessoryId, 'accessory')
  return references.map(ref => ref.product)
}

