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
  const { value: galleryValue, setValue } = useField<Array<{ image: string | number; alt?: string }>>({
    path,
  })
  const { dispatchFields } = useForm()

  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)

  // Helper function to calculate file hash
  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  // Helper function to check if file hash exists
  const checkFileHash = async (hash: string): Promise<{ exists: boolean; id?: string | number; alt?: string }> => {
    try {
      const response = await fetch('/api/media/check-hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hash }),
      })

      if (!response.ok) {
        // If endpoint fails, assume file doesn't exist and proceed with upload
        return { exists: false }
      }

      const result = (await response.json()) as { exists: boolean; id?: string | number; alt?: string }
      return result
    } catch (error) {
      // If check fails, assume file doesn't exist and proceed with upload
      console.error('Error checking file hash:', error)
      return { exists: false }
    }
  }

  const handleBulkUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0) return

      setUploading(true)
      setUploadCount(files.length)
      const uploadPromises: Array<Promise<{ id: string | number; alt: string }>> = []

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        const uploadPromise = (async () => {
          try {
            // Generate alt text from filename
            const filename = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim()
            const alt = filename || `image-${Math.random().toString(36).substring(2, 9)}`

            // Calculate file hash
            const fileHash = await calculateFileHash(file)

            // Check if file with same hash already exists
            const hashCheck = await checkFileHash(fileHash)

            if (hashCheck.exists && hashCheck.id) {
              // File already exists, use existing file ID
              return {
                id: hashCheck.id,
                alt: hashCheck.alt || alt,
              }
            }

            // File doesn't exist, proceed with upload
            // Include hash in form data so server doesn't need to calculate it
            const formData = new FormData()
            formData.append('file', file)
            formData.append('alt', alt)
            formData.append('hash', fileHash) // Send hash to server to avoid server-side calculation

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

        console.log('Upload results:', results)
        console.log('Current gallery value:', galleryValue)

        // Get current gallery value
        const currentValue = Array.isArray(galleryValue) ? galleryValue : []
        
        // Create new items with proper structure
        const newItems = results.map((result) => ({
          image: result.id,
          alt: result.alt || '',
        }))
        
        const updatedValue = [...currentValue, ...newItems]
        console.log('Updated value to set:', updatedValue)
        
        // Try both methods to ensure the update works
        // Method 1: Use dispatchFields UPDATE
        dispatchFields({
          type: 'UPDATE',
          path,
          value: updatedValue,
        })
        
        // Method 2: Also use setValue as a fallback
        setValue(updatedValue)
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
    [dispatchFields, path, galleryValue, setValue],
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

