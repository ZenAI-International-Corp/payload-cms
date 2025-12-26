import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'model',
    defaultColumns: ['model', 'categories', 'status', 'createdAt'],
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
        description: 'Auto-generated from model, or enter custom slug',
      },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Product Description',
      admin: {
        description: 'Detailed product description',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      required: true,
      admin: {
        description: 'Select one or more categories for this product',
      },
    },
    {
      name: 'details',
      type: 'group',
      label: 'Product Details',
      fields: [
        {
          name: 'content',
          type: 'richText',
          admin: {
            description: 'Additional product details and information',
          },
        },
      ],
    },
    {
      name: 'specification',
      type: 'group',
      label: 'Specification',
      fields: [
        {
          name: 'content',
          type: 'richText',
          admin: {
            description: 'Product specifications and technical details',
          },
        },
      ],
    },
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
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Main product image',
      },
    },
    {
      name: 'gallery',
      type: 'array',
      label: 'Product Gallery',
      admin: {
        description: 'Additional product images',
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
            description: 'Alt text for the image',
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation === 'create' && data && !data.slug && data.model) {
          data.slug = data.model
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

