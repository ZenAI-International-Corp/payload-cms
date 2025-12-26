import type { CollectionConfig } from 'payload'

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
  },
  access: {
    read: () => true,
  },
  timestamps: true,
}

