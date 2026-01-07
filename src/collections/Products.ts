import type { CollectionConfig } from 'payload'
import { purgeCacheAfterChange, purgeCacheAfterDelete } from '../payload/hooks/purgeCacheAfterChange'
import type { CollectionCacheStrategy } from '../payload/utils/cloudflareCache'
import { lexicalHTMLField } from '@payloadcms/richtext-lexical'

/**
 * Products 集合的缓存策略
 */
export const ProductsCacheStrategy: CollectionCacheStrategy = {
  // Cache purge configuration
  tags: ['api-products', 'page-products-list', 'page-product', 'page-home'],
  urlPatterns: [
    (doc, baseUrl) => `${baseUrl}/api/products`,
    (doc, baseUrl) => doc?.id ? `${baseUrl}/api/products/${doc.id}` : '',
    (doc, baseUrl) => doc?.slug ? `${baseUrl}/products/${doc.slug}` : '',
    (doc, baseUrl) => `${baseUrl}/products`,
    (doc, baseUrl) => `${baseUrl}/`,
  ],
  
  // API cache configuration (/api/products)
  apiCache: {
    maxAge: 60,                 // 1 minute browser cache (can't be purged remotely)
    sMaxAge: 604800,            // 7 days CDN cache (auto-purged on content update)
    staleWhileRevalidate: 86400, // 1 day stale content
    cacheTag: 'api-products',
  },
  
  // Page cache configuration (/products/*)
  pageCache: {
    maxAge: 120,                // 2 minutes browser cache (can't be purged remotely)
    sMaxAge: 604800,            // 7 days CDN cache (auto-purged on content update)
    staleWhileRevalidate: 86400, // 1 day stale content
    cacheTag: 'page-product',
  },
}

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'model',
    defaultColumns: ['model', 'mainCategory', 'status', 'createdAt'],
  },
  fields: [
    {
      name: 'model',
      type: 'text',
      required: true,
      label: 'Product Model',
      admin: {
        description: 'Product model number or name',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Auto-generated from model, or enter custom slug (URL-unsafe characters will be replaced)',
      },
      validate: (value: string | undefined) => {
        if (!value) return true // Let hook generate it
        
        // Check for URL-unsafe characters
        const unsafeChars = /[^a-z0-9-]/
        if (unsafeChars.test(value)) {
          return 'Slug can only contain lowercase letters, numbers, and hyphens'
        }
        
        // Check for leading/trailing hyphens
        if (value.startsWith('-') || value.endsWith('-')) {
          return 'Slug cannot start or end with a hyphen'
        }
        
        return true
      },
    },
    {
      name: 'description',
      type: 'text',
      label: 'Product Description',
      admin: {
        description: 'Detailed product description',
      },
    },
    {
      name: 'mainCategory',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: {
        description: 'Select the main product category (e.g., IP Cameras, NVR, etc.)',
      },
      filterOptions: () => {
        // Only show categories with type 'product-category' and no parent (main categories)
        return {
          type: { equals: 'product-category' },
          parent: { exists: false },
        }
      },
    },
    {
      name: 'subcategories',
      type: 'group',
      label: 'Subcategories',
      admin: {
        description: 'Select subcategories by type. Only available types for the selected main category will be shown.',
        condition: (data) => Boolean(data.mainCategory),
      },
      fields: [
        {
          name: 'resolutions',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          label: 'Resolutions',
          admin: {
            description: 'Select resolution categories',
            components: {
              Field: '/payload/components/ConditionalCategoryField',
            },
          },
          filterOptions: ({ data }) => {
            if (data.mainCategory) {
              return {
                parent: { equals: data.mainCategory },
                type: { equals: 'resolution' },
              }
            }
            return false
          },
        },
        {
          name: 'series',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          label: 'Series',
          admin: {
            description: 'Select series categories',
            components: {
              Field: '/payload/components/ConditionalCategoryField',
            },
          },
          filterOptions: ({ data }) => {
            if (data.mainCategory) {
              return {
                parent: { equals: data.mainCategory },
                type: { equals: 'series' },
              }
            }
            return false
          },
        },
        {
          name: 'accessoriesTypes',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          label: 'Accessories Types',
          admin: {
            description: 'Select accessories type categories',
            components: {
              Field: '/payload/components/ConditionalCategoryField',
            },
          },
          filterOptions: ({ data }) => {
            if (data.mainCategory) {
              return {
                parent: { equals: data.mainCategory },
                type: { equals: 'accessories-type' },
              }
            }
            return false
          },
        },
        {
          name: 'channels',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          label: 'Channels',
          admin: {
            description: 'Select channel categories',
            components: {
              Field: '/payload/components/ConditionalCategoryField',
            },
          },
          filterOptions: ({ data }) => {
            if (data.mainCategory) {
              return {
                parent: { equals: data.mainCategory },
                type: { equals: 'channels' },
              }
            }
            return false
          },
        },
        {
          name: 'ports',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          label: 'Ports',
          admin: {
            description: 'Select port categories',
            components: {
              Field: '/payload/components/ConditionalCategoryField',
            },
          },
          filterOptions: ({ data }) => {
            if (data.mainCategory) {
              return {
                parent: { equals: data.mainCategory },
                type: { equals: 'port' },
              }
            }
            return false
          },
        },
        {
          name: 'serverSeries',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          label: 'Server Series',
          admin: {
            description: 'Select server series categories',
            components: {
              Field: '/payload/components/ConditionalCategoryField',
            },
          },
          filterOptions: ({ data }) => {
            if (data.mainCategory) {
              return {
                parent: { equals: data.mainCategory },
                type: { equals: 'server-series' },
              }
            }
            return false
          },
        },
        {
          name: 'capacities',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          label: 'Capacities',
          admin: {
            description: 'Select capacity categories',
            components: {
              Field: '/payload/components/ConditionalCategoryField',
            },
          },
          filterOptions: ({ data }) => {
            if (data.mainCategory) {
              return {
                parent: { equals: data.mainCategory },
                type: { equals: 'capacity' },
              }
            }
            return false
          },
        },
        {
          name: 'voltages',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          label: 'Voltages',
          admin: {
            description: 'Select voltage categories',
            components: {
              Field: '/payload/components/ConditionalCategoryField',
            },
          },
          filterOptions: ({ data }) => {
            if (data.mainCategory) {
              return {
                parent: { equals: data.mainCategory },
                type: { equals: 'voltage' },
              }
            }
            return false
          },
        },
        {
          name: 'inputTypes',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          label: 'Input Types',
          admin: {
            description: 'Select input type categories',
            components: {
              Field: '/payload/components/ConditionalCategoryField',
            },
          },
          filterOptions: ({ data }) => {
            if (data.mainCategory) {
              return {
                parent: { equals: data.mainCategory },
                type: { equals: 'input-type' },
              }
            }
            return false
          },
        },
        {
          name: 'sizes',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          label: 'Sizes',
          admin: {
            description: 'Select size categories',
            components: {
              Field: '/payload/components/ConditionalCategoryField',
            },
          },
          filterOptions: ({ data }) => {
            if (data.mainCategory) {
              return {
                parent: { equals: data.mainCategory },
                type: { equals: 'size' },
              }
            }
            return false
          },
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        hidden: true, // Hidden field, automatically populated by hook
        description: 'Auto-populated: All categories (main + subcategories)',
      },
    },
    {
      name: 'relatedProducts',
      type: 'array',
      label: 'Related Products',
      admin: {
        description: 'Add related products (e.g., accessories for main products, or main products for accessories)',
      },
      validate: (value, { data }) => {
        // Additional validation: ensure no product relates to itself
        const currentProductId = (data as any)?.id
        
        if (value && Array.isArray(value) && currentProductId) {
          const selfReference = value.find((rel: any) => {
            const productId = typeof rel.product === 'object' ? rel.product?.id : rel.product
            return productId === currentProductId
          })
          
          if (selfReference) {
            return 'A product cannot be related to itself'
          }
        }
        return true
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          admin: {
            description: 'Select a related product',
          },
          filterOptions: ({ id }) => {
            // Exclude the current product from the selection list
            if (id) {
              return {
                id: { not_equals: id },
              }
            }
            // During creation, show all products
            return true
          },
        },
        {
          name: 'relationType',
          type: 'select',
          options: [
            { label: 'Accessory', value: 'accessory' },
            { label: 'Compatible Product', value: 'compatible' },
            { label: 'Alternative', value: 'alternative' },
            { label: 'Upgrade', value: 'upgrade' },
            { label: 'Related', value: 'related' },
          ],
          defaultValue: 'related',
          required: true,
          admin: {
            description: 'Specify the type of relationship',
          },
        },
        {
          name: 'note',
          type: 'textarea',
          admin: {
            description: 'Optional note about this relationship (e.g., "Recommended for outdoor installation")',
          },
        },
      ],
    },
    {
      name: 'details',
      type: 'richText',
      label: 'Product Details',
      admin: {
        description: 'Additional product details and information',
      },
    },
    lexicalHTMLField({
      lexicalFieldName: 'details',
      htmlFieldName: 'details_html',
    }),
    {
      name: 'specification',
      type: 'richText',
      label: 'Specification',
      admin: {
        description: 'Product specifications and technical details',
      },
    },
    lexicalHTMLField({
      lexicalFieldName: 'specification',
      htmlFieldName: 'specification_html',
    }),
    {
      name: 'downloads',
      type: 'array',
      label: 'Downloads',
      admin: {
        description: 'Upload PDF files, datasheets, manuals, etc.',
      },
      fields: [
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: {
            description: 'Display name for the download (e.g., "Product Datasheet", "User Manual")',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Optional description of the download file',
          },
        },
      ],
    },
    {
      name: 'gallery',
      type: 'array',
      label: 'Product Gallery',
      admin: {
        description: 'Product images. The first image will be used as the featured image. Use "Bulk Upload Images" button to upload multiple images at once.',
        components: {
          Field: '/payload/components/BulkImageUploadField',
        },
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'alt',
          type: 'text',
          admin: {
            description: 'Alt text for the image (auto-generated from filename if not provided)',
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Visible', value: 'visible' },
        { label: 'Hidden', value: 'hidden' },
      ],
      defaultValue: 'visible',
      admin: {
        position: 'sidebar',
        description: 'Visible products will be shown on the frontend, hidden products will be filtered out',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (data && (operation === 'create' || operation === 'update')) {
          // Sanitize slug function - removes URL-unsafe characters
          const sanitizeSlug = (text: string): string => {
            return text
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
              .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
          }

          // Generate or sanitize slug
          if (!data.slug && data.model) {
            // No slug provided, generate from model
            data.slug = sanitizeSlug(data.model)
          } else if (data.slug) {
            // Slug provided (manually or from previous), sanitize it
            data.slug = sanitizeSlug(data.slug)
          }

          // Ensure slug is unique (only on create, or on update if slug changed)
          if (data.slug) {
            let uniqueSlug = data.slug
            let counter = 1
            let exists = true

            while (exists) {
              const existing = await req.payload.find({
                collection: 'products',
                where: {
                  slug: { equals: uniqueSlug },
                },
                limit: 1,
                depth: 0,
                overrideAccess: true, // Bypass access control for slug check
              })

              // Check if the found document is the current one (for updates)
              const isCurrentDoc = operation === 'update' && 
                existing.docs.length > 0 && 
                existing.docs[0].id === req.data?.id

              if (existing.totalDocs === 0 || isCurrentDoc) {
                exists = false
              } else {
                // Slug exists, try with suffix
                uniqueSlug = `${data.slug}-${counter}`
                counter++
              }
            }

            data.slug = uniqueSlug
          }
        }
        return data
      },
    ],
    beforeChange: [
      ({ data }) => {
        // Merge all subcategories into a single categories array for easier querying
        if (data?.subcategories) {
          const allCategories: (string | number)[] = []
          
          // Add main category
          if (data.mainCategory) {
            allCategories.push(data.mainCategory)
          }
          
          // Add all subcategories from different types
          const subcategoryFields = [
            'resolutions',
            'series',
            'accessoriesTypes',
            'channels',
            'ports',
            'serverSeries',
            'capacities',
            'voltages',
            'inputTypes',
            'sizes',
          ]
          
          for (const field of subcategoryFields) {
            if (data.subcategories[field]) {
              const values = Array.isArray(data.subcategories[field])
                ? data.subcategories[field]
                : [data.subcategories[field]]
              allCategories.push(...values)
            }
          }
          
          // Store merged categories for querying
          data.categories = allCategories.filter((cat, index) => allCategories.indexOf(cat) === index) // Remove duplicates
        }
        
        return data
      },
    ],
    afterRead: [
      ({ doc }) => {
        // Ensure categories field is populated from subcategories if needed
        if (doc.subcategories && (!doc.categories || doc.categories.length === 0)) {
          const allCategories: (string | number)[] = []
          
          if (doc.mainCategory) {
            allCategories.push(doc.mainCategory)
          }
          
          const subcategoryFields = [
            'resolutions',
            'series',
            'accessoriesTypes',
            'channels',
            'ports',
            'serverSeries',
            'capacities',
            'voltages',
            'inputTypes',
            'sizes',
          ]
          
          for (const field of subcategoryFields) {
            if (doc.subcategories?.[field]) {
              const values = Array.isArray(doc.subcategories[field])
                ? doc.subcategories[field]
                : [doc.subcategories[field]]
              allCategories.push(...values)
            }
          }
          
          doc.categories = allCategories.filter((cat, index) => allCategories.indexOf(cat) === index)
        }
        
        return doc
      },
    ],
    // 在内容变更后清除 Cloudflare 缓存
    afterChange: [purgeCacheAfterChange],
    // 在内容删除后清除 Cloudflare 缓存
    afterDelete: [purgeCacheAfterDelete],
  },
  access: {
    read: ({ req }) => {
      // In admin panel, show all products
      if (req.user) {
        return true
      }
      // On frontend, only show visible products
      return {
        status: { equals: 'visible' },
      }
    },
  },
  timestamps: true,
}

