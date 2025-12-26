'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'
import { RelationshipField } from '@payloadcms/ui'
import type { RelationshipFieldClientComponent } from 'payload'
import { checkCategorySubcategories } from '../actions/checkCategorySubcategories'

/**
 * Conditional Category Field Component
 * Only shows the field if the main category has subcategories of the specified type
 * Uses server action to query database without fetch
 */
const ConditionalCategoryField: RelationshipFieldClientComponent = (props) => {
  const { field } = props

  // Get main category from form
  const mainCategory = useFormFields(([fields]) => fields.mainCategory?.value)

  // Get the category type from field name
  const categoryType = React.useMemo(() => {
    // Map field names to category types
    const typeMap: Record<string, string> = {
      resolutions: 'resolution',
      series: 'series',
      accessoriesTypes: 'accessories-type',
      channels: 'channels',
      ports: 'port',
      serverSeries: 'server-series',
      capacities: 'capacity',
      voltages: 'voltage',
      inputTypes: 'input-type',
      sizes: 'size',
    }
    return typeMap[field.name] || ''
  }, [field.name])

  // Check if there are subcategories of this type
  const [hasSubcategories, setHasSubcategories] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    // Reset state when main category or type changes
    setHasSubcategories(null)

    if (!mainCategory || !categoryType) {
      setHasSubcategories(false)
      return
    }

    // Query to check if there are subcategories of this type using server action
    const checkSubcategories = async () => {
      try {
        // Use server action to query database (no fetch needed)
        const hasSubs = await checkCategorySubcategories(
          mainCategory as string | number,
          categoryType,
        )
        setHasSubcategories(hasSubs)
      } catch (error) {
        console.error('Error checking subcategories:', error)
        setHasSubcategories(false)
      }
    }

    checkSubcategories()
  }, [mainCategory, categoryType])

  // Don't render anything if:
  // - No main category selected
  // - No category type mapped
  // - Still checking (hasSubcategories is null)
  // - Checked and no subcategories exist (hasSubcategories is false)
  if (
    !mainCategory ||
    !categoryType ||
    hasSubcategories === null ||
    hasSubcategories === false
  ) {
    return null
  }

  // Only render if we confirmed subcategories exist (hasSubcategories is true)
  return <RelationshipField {...props} />
}

export default ConditionalCategoryField

