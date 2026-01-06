import React from 'react'
import { RMARequestForm } from '@/frontend/components/RMARequestForm'
import './rma-request.css'

export const metadata = {
  title: 'RMA Request - IDView',
  description: 'Submit an RMA (Return Merchandise Authorization) or Technical Support request',
}

export default function RMARequestPage() {
  return (
    <div className="rma-request-page">
      <div className="container">
        <div className="rma-header">
          <h1 className="rma-title">RMA Request / Technical Support</h1>
          <p className="rma-description">
            Please fill out the form below to submit your RMA request or technical support inquiry.
            All fields marked with <span className="required-asterisk">*</span> are required.
          </p>
        </div>

        <RMARequestForm />

        <div className="rma-notice">
          <h3>Important Notice:</h3>
          <ul>
            <li>
              If we receive the product and find that there are no problems, regardless of if it&apos;s under warranty
              there will be a diagnostic fee charge.
            </li>
            <li>
              If we receive the product and find that there are no problems, the customer will be responsible for
              all freight charges.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

