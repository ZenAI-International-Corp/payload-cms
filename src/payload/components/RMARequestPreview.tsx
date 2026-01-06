'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo, ReactSelect, toast } from '@payloadcms/ui'
import type { Option } from '@payloadcms/ui/elements/ReactSelect'

type Address = {
  line1?: string
  line2?: string
  city?: string
  state?: string
  zipCode?: string
}

type Attachment = {
  file?: {
    id?: string
    filename?: string
    url?: string
    mimeType?: string
  } | string
}

type RMARequestData = {
  firstName?: string
  lastName?: string
  email?: string
  requestType?: string
  onSite?: string
  phoneNumber?: string
  companyName?: string
  address?: Address
  invoiceDate?: string
  invoiceNumber?: string
  serialNumber?: string
  model?: string
  deviceLoginUsername?: string
  distributor?: string
  subject?: string
  attachments?: Attachment[]
  problem?: string
  status?: string
  adminNotes?: string
}

export const RMARequestPreview: React.FC = () => {
  const { id } = useDocumentInfo()
  const [data, setData] = useState<RMARequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const statusOptions: Option[] = [
    { label: 'New', value: 'new' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Closed', value: 'closed' },
  ]

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/rma-requests/${id}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch RMA request data')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching RMA request:', err)
        setError('Failed to load preview data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleStatusChange = async (selected: Option | Option[]) => {
    if (!id || Array.isArray(selected)) return

    const newStatus = selected.value as string
    setSaving(true)

    try {
      const response = await fetch(`/api/rma-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const result = (await response.json()) as { doc: RMARequestData }
      setData(result.doc)
      toast.success('Status updated successfully')
    } catch (err) {
      console.error('Error updating status:', err)
      toast.error('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatRequestType = (type: string) => {
    if (type === 'rma') return 'RMA'
    if (type === 'tech-support') return 'Tech Support'
    return type
  }

  if (loading) {
    return (
      <div className="document-fields">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="document-fields">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
          {error || 'No data available'}
        </div>
      </div>
    )
  }

  const {
    firstName = '',
    lastName = '',
    email = '',
    requestType = '',
    onSite = '',
    phoneNumber = '',
    companyName = '',
    address = {},
    invoiceDate = '',
    invoiceNumber = '',
    serialNumber = '',
    model = '',
    deviceLoginUsername = '',
    distributor = '',
    subject = '',
    attachments = [],
    problem = '',
    status = 'new',
    adminNotes = '',
  } = data

  return (
    <div className="document-fields document-fields--has-sidebar">
      {/* Main Content */}
      <div className="document-fields__main">
        <div className="gutter gutter--left gutter--right document-fields__edit">
          <div className="render-fields document-fields__fields">
            
            {/* Contact Information */}
            <div className="field-type text" style={{ flex: '1 1 auto' }}>
              <label className="field-label">Name</label>
              <div className="field-type__wrap">
                <input 
                  type="text" 
                  value={`${firstName} ${lastName}`} 
                  readOnly 
                  disabled
                  style={{ background: 'var(--theme-elevation-50)' }}
                />
              </div>
            </div>

            <div className="field-type text" style={{ flex: '1 1 auto' }}>
              <label className="field-label">Email</label>
              <div className="field-type__wrap">
                <input 
                  type="text" 
                  value={email} 
                  readOnly 
                  disabled
                  style={{ background: 'var(--theme-elevation-50)' }}
                />
              </div>
            </div>

            <div className="field-type text" style={{ flex: '1 1 auto' }}>
              <label className="field-label">Phone</label>
              <div className="field-type__wrap">
                <input 
                  type="text" 
                  value={phoneNumber} 
                  readOnly 
                  disabled
                  style={{ background: 'var(--theme-elevation-50)' }}
                />
              </div>
            </div>

            {companyName && (
              <div className="field-type text" style={{ flex: '1 1 auto' }}>
                <label className="field-label">Company</label>
                <div className="field-type__wrap">
                  <input 
                    type="text" 
                    value={companyName} 
                    readOnly 
                    disabled
                    style={{ background: 'var(--theme-elevation-50)' }}
                  />
                </div>
              </div>
            )}

            {/* Request Details */}
            <div className="field-type text" style={{ flex: '1 1 auto' }}>
              <label className="field-label">Request Type</label>
              <div className="field-type__wrap">
                <input 
                  type="text" 
                  value={formatRequestType(requestType)} 
                  readOnly 
                  disabled
                  style={{ background: 'var(--theme-elevation-50)' }}
                />
              </div>
            </div>

            <div className="field-type text" style={{ flex: '1 1 auto' }}>
              <label className="field-label">On Site</label>
              <div className="field-type__wrap">
                <input 
                  type="text" 
                  value={onSite === 'yes' ? 'Yes' : 'No'} 
                  readOnly 
                  disabled
                  style={{ background: 'var(--theme-elevation-50)' }}
                />
              </div>
            </div>

            <div className="field-type text" style={{ flex: '1 1 auto' }}>
              <label className="field-label">Subject</label>
              <div className="field-type__wrap">
                <input 
                  type="text" 
                  value={subject} 
                  readOnly 
                  disabled
                  style={{ background: 'var(--theme-elevation-50)' }}
                />
              </div>
            </div>

            {/* Address */}
            {address && address.line1 && (
              <div className="field-type group-field group-field--top-level" id="field-address" style={{ flex: '1 1 auto' }}>
                <div className="group-field__wrap">
                  <div className="group-field__header">
                    <header>
                      <h3 className="group-field__title">
                        <span className="field-label">Address</span>
                      </h3>
                    </header>
                  </div>
                  <div className="render-fields render-fields--margins-small">
                    
                    <div className="field-type text" style={{ flex: '1 1 auto' }}>
                      <label className="field-label">Address Line 1</label>
                      <div className="field-type__wrap">
                        <input 
                          type="text" 
                          value={address.line1} 
                          readOnly 
                          disabled
                          style={{ background: 'var(--theme-elevation-50)' }}
                        />
                      </div>
                    </div>

                    {address.line2 && (
                      <div className="field-type text" style={{ flex: '1 1 auto' }}>
                        <label className="field-label">Address Line 2</label>
                        <div className="field-type__wrap">
                          <input 
                            type="text" 
                            value={address.line2} 
                            readOnly 
                            disabled
                            style={{ background: 'var(--theme-elevation-50)' }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="field-type text" style={{ flex: '1 1 auto' }}>
                      <label className="field-label">City</label>
                      <div className="field-type__wrap">
                        <input 
                          type="text" 
                          value={address.city} 
                          readOnly 
                          disabled
                          style={{ background: 'var(--theme-elevation-50)' }}
                        />
                      </div>
                    </div>

                    <div className="field-type text" style={{ flex: '1 1 auto' }}>
                      <label className="field-label">State</label>
                      <div className="field-type__wrap">
                        <input 
                          type="text" 
                          value={address.state} 
                          readOnly 
                          disabled
                          style={{ background: 'var(--theme-elevation-50)' }}
                        />
                      </div>
                    </div>

                    <div className="field-type text" style={{ flex: '1 1 auto' }}>
                      <label className="field-label">Zip Code</label>
                      <div className="field-type__wrap">
                        <input 
                          type="text" 
                          value={address.zipCode} 
                          readOnly 
                          disabled
                          style={{ background: 'var(--theme-elevation-50)' }}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Device Information */}
            <div className="field-type text" style={{ flex: '1 1 auto' }}>
              <label className="field-label">Serial Number</label>
              <div className="field-type__wrap">
                <input 
                  type="text" 
                  value={serialNumber} 
                  readOnly 
                  disabled
                  style={{ background: 'var(--theme-elevation-50)' }}
                />
              </div>
            </div>

            {model && (
              <div className="field-type text" style={{ flex: '1 1 auto' }}>
                <label className="field-label">Model</label>
                <div className="field-type__wrap">
                  <input 
                    type="text" 
                    value={model} 
                    readOnly 
                    disabled
                    style={{ background: 'var(--theme-elevation-50)' }}
                  />
                </div>
              </div>
            )}

            <div className="field-type text" style={{ flex: '1 1 auto' }}>
              <label className="field-label">Device Login Username</label>
              <div className="field-type__wrap">
                <input 
                  type="text" 
                  value={deviceLoginUsername} 
                  readOnly 
                  disabled
                  style={{ background: 'var(--theme-elevation-50)' }}
                />
              </div>
            </div>

            {distributor && (
              <div className="field-type text" style={{ flex: '1 1 auto' }}>
                <label className="field-label">Distributor</label>
                <div className="field-type__wrap">
                  <input 
                    type="text" 
                    value={distributor} 
                    readOnly 
                    disabled
                    style={{ background: 'var(--theme-elevation-50)' }}
                  />
                </div>
              </div>
            )}

            {/* Invoice Information */}
            {invoiceDate && (
              <div className="field-type text" style={{ flex: '1 1 auto' }}>
                <label className="field-label">Invoice Date</label>
                <div className="field-type__wrap">
                  <input 
                    type="text" 
                    value={formatDate(invoiceDate)} 
                    readOnly 
                    disabled
                    style={{ background: 'var(--theme-elevation-50)' }}
                  />
                </div>
              </div>
            )}

            {invoiceNumber && (
              <div className="field-type text" style={{ flex: '1 1 auto' }}>
                <label className="field-label">Invoice Number</label>
                <div className="field-type__wrap">
                  <input 
                    type="text" 
                    value={invoiceNumber} 
                    readOnly 
                    disabled
                    style={{ background: 'var(--theme-elevation-50)' }}
                  />
                </div>
              </div>
            )}

            {/* Problem Description */}
            <div className="field-type textarea" style={{ flex: '1 1 auto' }}>
              <label className="field-label">Problem Description</label>
              <div className="field-type__wrap">
                <textarea 
                  value={problem}
                  readOnly 
                  disabled
                  rows={6}
                  style={{ background: 'var(--theme-elevation-50)', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Attachments */}
            {attachments && attachments.length > 0 && (
              <div className="field-type" style={{ flex: '1 1 auto' }}>
                <label className="field-label">Attachments</label>
                <div className="field-type__wrap">
                  {attachments.map((attachment: any, index: number) => {
                    const file = attachment?.file
                    if (!file || typeof file !== 'object' || !file.filename) return null
                    
                    // Check if file is an image
                    const isImage = file.mimeType?.startsWith('image/')
                    
                    return (
                      <div 
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: 'var(--theme-elevation-50)',
                          border: '1px solid var(--theme-elevation-200)',
                          borderRadius: '3px',
                          marginBottom: '8px',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>
                          {isImage ? '🖼️' : '📎'}
                        </span>
                        <span style={{ flex: 1, fontSize: '13px' }}>{file.filename}</span>
                        {file.url && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {isImage && (
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{
                                  padding: '4px 12px',
                                  background: 'var(--theme-elevation-500)',
                                  color: 'var(--theme-elevation-0)',
                                  textDecoration: 'none',
                                  borderRadius: '3px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                }}
                              >
                                View
                              </a>
                            )}
                            <a 
                              href={file.url} 
                              download={file.filename}
                              style={{
                                padding: '4px 12px',
                                background: 'var(--theme-success-500)',
                                color: 'var(--theme-elevation-0)',
                                textDecoration: 'none',
                                borderRadius: '3px',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              Download
                            </a>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {adminNotes && (
              <div className="field-type textarea" style={{ flex: '1 1 auto' }}>
                <label className="field-label">Admin Notes (Internal)</label>
                <div className="field-type__wrap">
                  <textarea 
                    value={adminNotes}
                    readOnly 
                    disabled
                    rows={4}
                    style={{ 
                      background: 'var(--theme-elevation-50)', 
                      resize: 'vertical',
                      borderLeft: '3px solid var(--theme-warning-500)',
                    }}
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="document-fields__sidebar-wrap">
        <div className="document-fields__sidebar">
          <div className="document-fields__sidebar-fields">
            <div className="render-fields">
              
              <div className="field-type select" id="field-status" style={{ flex: '1 1 auto' }}>
                <label className="field-label" htmlFor="field-status">Status</label>
                <div className="field-type__wrap">
                  <ReactSelect
                    value={statusOptions.find(opt => opt.value === status)}
                    onChange={handleStatusChange}
                    options={statusOptions}
                    disabled={saving}
                    isClearable={false}
                  />
                  {saving && (
                    <div 
                      className="field-description"
                      style={{ fontStyle: 'italic', color: 'var(--theme-elevation-600)' }}
                    >
                      Saving...
                    </div>
                  )}
                </div>
                <div className="field-description field-description-status">
                  Current status of the RMA request
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}