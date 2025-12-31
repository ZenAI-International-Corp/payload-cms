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
        description: 'Auto-generated from name, or enter custom slug',
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
        if (operation === 'create' && data && !data.slug && data.name) {
          data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
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

