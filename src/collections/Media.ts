import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  endpoints: [
    {
      path: '/check-hash',
      method: 'post',
      handler: async (req) => {
        // Check if user is authenticated (required for media operations)
        if (!req.user) {
          throw new APIError('Unauthorized', 401)
        }

        const body = (await req.json()) as { hash: string }
        if (!body.hash) {
          throw new APIError('Hash is required', 400)
        }

        // Check if a file with the same hash already exists
        const existing = await req.payload.find({
          collection: 'media',
          where: {
            hash: { equals: body.hash },
          },
          limit: 1,
          depth: 0,
          overrideAccess: false,
        })

        if (existing.totalDocs > 0) {
          const existingDoc = existing.docs[0]
          return Response.json({
            exists: true,
            id: existingDoc.id,
            alt: existingDoc.alt,
            filename: existingDoc.filename,
          })
        }

        return Response.json({ exists: false })
      },
    },
  ],
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Auto-generated from filename if not provided',
      },
    },
    {
      name: 'hash',
      type: 'text',
      admin: {
        hidden: true, // Hidden field, automatically populated by hook
        description: 'SHA-256 hash of the file for duplicate detection',
      },
      index: true, // Index for faster duplicate lookups
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
        // Handle file hash for duplicate detection
        // Prefer client-provided hash to avoid server-side calculation
        if (operation === 'create') {
          let hashHex: string | undefined

          // First, try to get hash from data (provided by client via FormData)
          // For multipart/form-data uploads, Payload automatically parses form fields into data
          if (data && typeof data === 'object' && 'hash' in data && data.hash) {
            hashHex = String(data.hash)
          }

          // If no client-provided hash and file exists, calculate hash as fallback
          // This handles cases where files are uploaded via other methods (e.g., direct API calls)
          if (!hashHex && req.file) {
            try {
              // Calculate SHA-256 hash of the file (fallback for non-client uploads)
              const fileData = req.file.data as unknown
              // Convert to Uint8Array for crypto.subtle
              let uint8Array: Uint8Array
              if (fileData instanceof Uint8Array) {
                uint8Array = fileData
              } else if (fileData instanceof ArrayBuffer) {
                uint8Array = new Uint8Array(fileData)
              } else {
                // For Buffer or other types, convert to ArrayBuffer first
                const buffer = fileData as { buffer?: ArrayBuffer; [key: string]: unknown }
                if (buffer.buffer instanceof ArrayBuffer) {
                  uint8Array = new Uint8Array(buffer.buffer)
                } else {
                  // Fallback: create a new ArrayBuffer from the data
                  const blob = new Blob([fileData as BlobPart])
                  const arrayBuffer = await blob.arrayBuffer()
                  uint8Array = new Uint8Array(arrayBuffer)
                }
              }

              // Use the buffer property of Uint8Array for crypto.subtle
              const hashBuffer = await crypto.subtle.digest('SHA-256', uint8Array.buffer as ArrayBuffer)
              const hashArray = Array.from(new Uint8Array(hashBuffer))
              hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
            } catch (error) {
              // If hash calculation fails, log error but don't block upload
              console.error('Error calculating file hash:', error)
            }
          }

          // If we have a hash, check for duplicates and store it
          if (hashHex && req?.payload) {
            // Check if a file with the same hash already exists
            const existing = await req.payload.find({
              collection: 'media',
              where: {
                hash: { equals: hashHex },
              },
              limit: 1,
              depth: 0,
              overrideAccess: false,
            })

            if (existing.totalDocs > 0) {
              const existingDoc = existing.docs[0]
              // If duplicate found, store existing document ID in context
              req.context = req.context || {}
              req.context.duplicateMediaId = existingDoc.id
            }

            // Store hash in data
            data.hash = hashHex
          }
        }

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
