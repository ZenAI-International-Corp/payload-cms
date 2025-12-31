import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Auto-generated from filename if not provided',
      },
    },
  ],
  upload: {
    // These are not supported on Workers yet due to lack of sharp
    crop: false,
    focalPoint: false,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Only auto-generate alt on create, or if alt is empty on update
        if (operation === 'create' || !data?.alt) {
          let baseAlt = ''

          // Try to get filename from the uploaded file
          // filename is available in data after file upload
          if (data?.filename) {
            // Remove file extension and clean up the filename
            baseAlt = data.filename
              .replace(/\.[^/.]+$/, '') // Remove extension
              .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
              .replace(/\s+/g, ' ') // Replace multiple spaces with single space
              .trim()
          }

          // If no filename, generate a random string
          if (!baseAlt) {
            baseAlt = `image-${Math.random().toString(36).substring(2, 9)}`
          }

          // Check if alt already exists
          if (req?.payload) {
            let finalAlt = baseAlt
            let counter = 1

            // Check for duplicates and append random string if needed
            while (true) {
              const existing = await req.payload.find({
                collection: 'media',
                where: {
                  alt: { equals: finalAlt },
                  ...(operation === 'update' && data?.id ? { id: { not_equals: data.id } } : {}),
                },
                limit: 1,
                depth: 0,
                overrideAccess: false,
              })

              if (existing.totalDocs === 0) {
                break
              }

              // Add random string to make it unique
              const randomSuffix = Math.random().toString(36).substring(2, 6)
              finalAlt = `${baseAlt}-${randomSuffix}`
              counter++

              // Prevent infinite loop
              if (counter > 10) {
                finalAlt = `${baseAlt}-${Date.now()}`
                break
              }
            }

            data.alt = finalAlt
          } else {
            // Fallback if payload is not available
            data.alt = baseAlt
          }
        }

        return data
      },
    ],
  },
}
