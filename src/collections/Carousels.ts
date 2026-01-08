import type { CollectionConfig } from 'payload'

export const Carousels: CollectionConfig = {
  slug: 'carousels',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', 'isActive', 'updatedAt'],
    description: 'Manage homepage carousel slides',
  },
  access: {
    read: () => true, // 前端可以读取
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Title',
      admin: {
        description: 'Internal title for identification (not displayed on frontend)',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Image',
      admin: {
        description: 'Carousel slide image',
      },
    },
    {
      name: 'altText',
      type: 'text',
      label: 'Alt Text',
      admin: {
        description: 'Alternative text for SEO and accessibility',
      },
    },
    {
      name: 'isClickable',
      type: 'checkbox',
      label: 'Is Clickable',
      defaultValue: false,
      admin: {
        description: 'Enable click to configure link behavior',
      },
    },
    {
      name: 'linkUrl',
      type: 'text',
      label: 'Link URL',
      admin: {
        description: 'URL to navigate when clicked',
        condition: (data) => data.isClickable === true,
      },
    },
    {
      name: 'linkTarget',
      type: 'select',
      label: 'Link Target',
      options: [
        {
          label: 'Same Page',
          value: '_self',
        },
        {
          label: 'New Tab',
          value: '_blank',
        },
      ],
      defaultValue: '_self',
      admin: {
        description: 'How to open the link',
        condition: (data) => data.isClickable === true,
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Order',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Is Active',
      defaultValue: true,
      admin: {
        description: 'Only active slides will be displayed on homepage',
      },
    },
  ],
  timestamps: true,
}

