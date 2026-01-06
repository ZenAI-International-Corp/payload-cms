'use client'

import React, { useState, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import './RMARequestForm.css'

interface FormData {
  firstName: string
  lastName: string
  email: string
  requestType: 'rma' | 'tech-support'
  onSite: 'yes' | 'no'
  phoneNumber: string
  companyName: string
  address: {
    line1: string
    line2: string
    city: string
    state: string
    zipCode: string
  }
  invoiceDate: string
  invoiceNumber: string
  serialNumber: string
  model: string
  deviceLoginUsername: string
  distributor: string
  subject: string
  attachments: File[]
  problem: string
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  requestType: 'rma',
  onSite: 'yes',
  phoneNumber: '',
  companyName: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    zipCode: '',
  },
  invoiceDate: '',
  invoiceNumber: '',
  serialNumber: '',
  model: '',
  deviceLoginUsername: '',
  distributor: '',
  subject: '',
  attachments: [],
  problem: '',
}

export function RMARequestForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setFormData((prev) => ({
        ...prev,
        attachments: Array.from(files),
      }))
    }
  }

  const uploadFile = async (file: File): Promise<number> => {
    // Validate file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File "${file.name}" exceeds maximum size of 10MB`)
    }

    const formData = new FormData()
    formData.append('file', file)

    // Upload using the secure RMA-specific endpoint
    const response = await fetch('/api/rma-requests/upload-attachment', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({ message: 'Upload failed' }))) as {
        message?: string
      }
      throw new Error(errorData.message || `Failed to upload file: ${file.name}`)
    }

    const result = (await response.json()) as { doc: { id: number } }
    return result.doc.id
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Upload attachments first
      const attachmentIds: number[] = []
      for (const file of formData.attachments) {
        try {
          const mediaId = await uploadFile(file)
          attachmentIds.push(mediaId)
        } catch (err) {
          console.error('Error uploading file:', err)
          throw new Error(`Failed to upload file: ${file.name}`)
        }
      }

      // Prepare data for submission
      const submitData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        requestType: formData.requestType,
        onSite: formData.onSite,
        phoneNumber: formData.phoneNumber,
        companyName: formData.companyName || undefined,
        address: {
          line1: formData.address.line1,
          line2: formData.address.line2 || undefined,
          city: formData.address.city,
          state: formData.address.state,
          zipCode: formData.address.zipCode,
        },
        invoiceDate: formData.invoiceDate || undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        serialNumber: formData.serialNumber,
        model: formData.model || undefined,
        deviceLoginUsername: formData.deviceLoginUsername,
        distributor: formData.distributor || undefined,
        subject: formData.subject,
        problem: formData.problem,
        status: 'new',
      }

      // Add attachments if any
      if (attachmentIds.length > 0) {
        submitData.attachments = attachmentIds.map((id) => ({ file: id }))
      }

      // Submit RMA request
      const response = await fetch('/api/rma-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({ message: 'Submission failed' }))) as {
          message?: string
        }
        throw new Error(errorData.message || 'Failed to submit RMA request')
      }

      // Redirect to success page
      router.push('/rma-request/success')
    } catch (err) {
      console.error('Error submitting form:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while submitting your request')
      setIsSubmitting(false)
    }
  }

  return (
    <form className="rma-form" onSubmit={handleSubmit}>
      {error && (
        <div className="form-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Personal Information */}
      <section className="form-section">
        <h2 className="section-title">Personal Information</h2>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">
              First Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">
              Last Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email Address <span className="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phoneNumber">
            Phone Number <span className="required">*</span>
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="companyName">Company Name</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
          />
        </div>
      </section>

      {/* Request Type */}
      <section className="form-section">
        <h2 className="section-title">Request Type</h2>
        <div className="form-group">
          <label htmlFor="requestType">
            RMA/TECH Support? <span className="required">*</span>
          </label>
          <select
            id="requestType"
            name="requestType"
            value={formData.requestType}
            onChange={handleInputChange}
            required
          >
            <option value="rma">RMA</option>
            <option value="tech-support">TECH Support</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            Are you on site? <span className="required">*</span>
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="onSite"
                value="yes"
                checked={formData.onSite === 'yes'}
                onChange={handleInputChange}
                required
              />
              <span>Yes</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="onSite"
                value="no"
                checked={formData.onSite === 'no'}
                onChange={handleInputChange}
                required
              />
              <span>No</span>
            </label>
          </div>
        </div>
      </section>

      {/* Address */}
      <section className="form-section">
        <h2 className="section-title">Address</h2>
        <div className="form-group">
          <label htmlFor="address.line1">
            Address Line 1 <span className="required">*</span>
          </label>
          <input
            type="text"
            id="address.line1"
            name="address.line1"
            value={formData.address.line1}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="address.line2">Address Line 2</label>
          <input
            type="text"
            id="address.line2"
            name="address.line2"
            value={formData.address.line2}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="address.city">
              City <span className="required">*</span>
            </label>
            <input
              type="text"
              id="address.city"
              name="address.city"
              value={formData.address.city}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="address.state">
              State <span className="required">*</span>
            </label>
            <input
              type="text"
              id="address.state"
              name="address.state"
              value={formData.address.state}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="address.zipCode">
              Zip Code <span className="required">*</span>
            </label>
            <input
              type="text"
              id="address.zipCode"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
      </section>

      {/* Product Information */}
      <section className="form-section">
        <h2 className="section-title">Product Information</h2>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="invoiceDate">Invoice Date</label>
            <input
              type="date"
              id="invoiceDate"
              name="invoiceDate"
              value={formData.invoiceDate}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="invoiceNumber">Invoice Number</label>
            <input
              type="text"
              id="invoiceNumber"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="serialNumber">
              Serial Number <span className="required">*</span>
            </label>
            <input
              type="text"
              id="serialNumber"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="model">Model</label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="deviceLoginUsername">
            Device Login Username (IP devices applicable) <span className="required">*</span>
          </label>
          <small className="form-hint">If not applicable, please write n/a</small>
          <input
            type="text"
            id="deviceLoginUsername"
            name="deviceLoginUsername"
            value={formData.deviceLoginUsername}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="distributor">Which distributor did you buy products from?</label>
          <input
            type="text"
            id="distributor"
            name="distributor"
            value={formData.distributor}
            onChange={handleInputChange}
          />
        </div>
      </section>

      {/* Request Details */}
      <section className="form-section">
        <h2 className="section-title">Request Details</h2>
        <div className="form-group">
          <label htmlFor="subject">
            Subject <span className="required">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="attachments">Attachments</label>
          <small className="file-hint">
            Allowed file types: Images (JPEG, PNG, GIF, WebP), PDF, Word documents (.doc, .docx),
            Excel files (.xls, .xlsx), and text files (.txt). Maximum file size: 10MB per file.
          </small>
          <input
            type="file"
            id="attachments"
            name="attachments"
            multiple
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          {formData.attachments.length > 0 && (
            <div className="file-list">
              <p>Selected files:</p>
              <ul>
                {formData.attachments.map((file, index) => {
                  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
                  const isOversized = file.size > 10 * 1024 * 1024
                  return (
                    <li key={index} className={isOversized ? 'file-error' : ''}>
                      {file.name} ({fileSizeMB} MB)
                      {isOversized && ' - File too large!'}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="problem">
            Problem <span className="required">*</span>
          </label>
          <textarea
            id="problem"
            name="problem"
            value={formData.problem}
            onChange={handleInputChange}
            rows={6}
            required
            placeholder="Please describe the problem in detail"
          />
        </div>
      </section>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  )
}

