'use client'

import React, { useState, useCallback } from 'react'
import { ArrayField, useField, useForm } from '@payloadcms/ui'
import type { ArrayFieldClientComponent } from 'payload'

/**
 * Bulk Image Upload Field Component
 * Allows users to upload multiple images at once for the Product Gallery
 */
const BulkImageUploadField: ArrayFieldClientComponent = (props) => {
  const { path } = props
  const { dispatchFields } = useForm()
  const { value: galleryValue } = useField<Array<{ image: string | number; alt?: string }>>({
    path,
  })

  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)

  const handleBulkUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0) return

      setUploading(true)
      setUploadCount(files.length)
      const uploadPromises: Array<Promise<{ id: string | number; alt: string }>> = []

      // Upload each file using Payload REST API
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        const uploadPromise = (async () => {
          try {
            // Generate alt text from filename
            const filename = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim()
            const alt = filename || `image-${Math.random().toString(36).substring(2, 9)}`

            // Upload file to media collection using Payload REST API
            // Authentication is handled automatically via cookies in Admin Panel
            const formData = new FormData()
            formData.append('file', file)
            formData.append('alt', alt)

            const response = await fetch('/api/media', {
              method: 'POST',
              body: formData,
              // Don't set Content-Type header, browser will set it with boundary for multipart/form-data
            })

            if (!response.ok) {
              const errorText = await response.text()
              throw new Error(`Failed to upload ${file.name}: ${errorText}`)
            }

            const mediaDoc = (await response.json()) as { doc?: { id: string | number } }

            if (!mediaDoc.doc?.id) {
              throw new Error(`Failed to get media ID for ${file.name}`)
            }

            return {
              id: mediaDoc.doc.id,
              alt,
            }
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error)
            throw error
          }
        })()

        uploadPromises.push(uploadPromise)
      }

      try {
        // Wait for all uploads to complete
        const results = await Promise.all(uploadPromises)

        // Add all uploaded images to the gallery array
        const currentValue = galleryValue || []
        const newItems = results.map((result) => ({
          image: result.id,
          alt: result.alt,
        }))

        // Update the field value
        dispatchFields({
          type: 'UPDATE',
          path,
          value: [...currentValue, ...newItems],
        })
      } catch (error) {
        console.error('Error during bulk upload:', error)
        alert('Some files failed to upload. Please check the console for details.')
      } finally {
        setUploading(false)
        setUploadCount(0)
        // Reset the file input
        event.target.value = ''
      }
    },
    [dispatchFields, path, galleryValue],
  )

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor="bulk-upload-input"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: 'var(--theme-elevation-100)',
            border: '1px solid var(--theme-elevation-300)',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <input
            id="bulk-upload-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleBulkUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {uploading ? 'Uploading...' : 'Bulk Upload Images'}
        </label>
        {uploading && (
          <span style={{ marginLeft: '12px', color: 'var(--theme-text)' }}>
            Uploading {uploadCount} file{uploadCount !== 1 ? 's' : ''}...
          </span>
        )}
      </div>

      {/* Render the default ArrayField for managing individual items */}
      <ArrayField {...props} />
    </div>
  )
}

export default BulkImageUploadField

