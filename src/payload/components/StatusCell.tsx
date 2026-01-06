'use client'

import React, { useState } from 'react'
import { toast } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'
import './StatusCell.css'

export const StatusCell: React.FC<DefaultCellComponentProps> = ({ cellData, rowData }) => {
  const [status, setStatus] = useState(cellData as string)
  const [saving, setSaving] = useState(false)

  const statusOptions = [
    { label: 'New', value: 'new' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Closed', value: 'closed' },
  ]

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    setSaving(true)

    try {
      const response = await fetch(`/api/rma-requests/${rowData.id}`, {
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

      setStatus(newStatus)
      toast.success('Status updated successfully')
    } catch (err) {
      console.error('Error updating status:', err)
      toast.error('Failed to update status')
      // 恢复到原来的状态
      setStatus(cellData as string)
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'new':
        return '#3b82f6' // blue
      case 'in-progress':
        return '#f59e0b' // amber
      case 'resolved':
        return '#10b981' // green
      case 'closed':
        return '#6b7280' // gray
      default:
        return '#6b7280'
    }
  }

  return (
    <div className="status-cell-wrapper">
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={saving}
        className="status-cell-select"
        style={{
          borderLeft: `4px solid ${getStatusColor(status)}`,
        }}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

