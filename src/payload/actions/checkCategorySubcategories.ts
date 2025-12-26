'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function checkCategorySubcategories(
  parentId: number | string,
  categoryType: string,
): Promise<boolean> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'categories',
      where: {
        parent: { equals: parentId },
        type: { equals: categoryType },
      },
      limit: 1,
      depth: 0,
      overrideAccess: false,
    })

    return result.totalDocs > 0
  } catch (error) {
    console.error('Error checking category subcategories:', error)
    return false
  }
}

