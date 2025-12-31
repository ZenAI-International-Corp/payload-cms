import type { CollectionConfig } from 'payload'
import { purgeCacheAfterChange, purgeCacheAfterDelete } from '../payload/hooks/purgeCacheAfterChange'
import type { CollectionCacheStrategy } from '../payload/utils/cloudflareCache'

/**
 * Categories 集合的缓存策略
 * 
 * 分类变化较少，可以使用更长的缓存时间
 */
export const CategoriesCacheStrategy: CollectionCacheStrategy = {
  // Cache purge configuration
  tags: ['api-categories', 'page-products-list'],
  urlPatterns: [
    (doc, baseUrl) => `${baseUrl}/api/categories`,
    (doc, baseUrl) => doc?.id ? `${baseUrl}/api/categories/${doc.id}` : '',
    (doc, baseUrl) => doc?.slug ? `${baseUrl}/products/category/${doc.slug}` : '',
  ],
  
  // API cache configuration (/api/categories)
  apiCache: {
    maxAge: 60,                  // 1 minute browser cache (can't be purged remotely)
    sMaxAge: 2592000,            // 30 days CDN cache (auto-purged on content update)
    staleWhileRevalidate: 86400, // 1 day stale content
    cacheTag: 'api-categories',
  },
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'image', 'parent', 'type', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Category Name',
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Auto-generated from name, or enter custom slug (URL-unsafe characters will be replaced)',
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
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Parent category (leave empty for top-level categories)',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Product Category', value: 'product-category' },
        { label: 'Resolution', value: 'resolution' },
        { label: 'Series', value: 'series' },
        { label: 'Accessories Type', value: 'accessories-type' },
        { label: 'Channels', value: 'channels' },
        { label: 'Port', value: 'port' },
        { label: 'Server Series', value: 'server-series' },
        { label: 'Capacity', value: 'capacity' },
        { label: 'Voltage', value: 'voltage' },
        { label: 'Input Type', value: 'input-type' },
        { label: 'Size', value: 'size' },
      ],
      admin: {
        description: 'Type of category for filtering purposes',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional description for this category',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Category header image (especially for Product Category type)',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (data && (operation === 'create' || operation === 'update')) {
          // Sanitize slug function - removes URL-unsafe characters
          const sanitizeSlug = (text: string): string => {
            return text
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
              .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
          }

          // Generate or sanitize slug
          if (!data.slug && data.name) {
            // No slug provided, generate from name
            data.slug = sanitizeSlug(data.name)
          } else if (data.slug) {
            // Slug provided (manually or from previous), sanitize it
            data.slug = sanitizeSlug(data.slug)
          }
        }
        return data
      },
    ],
    // 在内容变更后清除 Cloudflare 缓存
    afterChange: [purgeCacheAfterChange],
    // 在内容删除后清除 Cloudflare 缓存
    afterDelete: [purgeCacheAfterDelete],
  },
  access: {
    read: () => true,
  },
  timestamps: true,
}

