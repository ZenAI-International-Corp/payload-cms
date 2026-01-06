import React from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import '../rma-request.css'
import './success.css'

export const metadata = {
  title: 'RMA Request Submitted - IDView',
  description: 'Your RMA request has been successfully submitted',
}

export default function RMASuccessPage() {
  return (
    <div className="rma-request-page">
      <div className="container">
        <div className="success-container">
          <CheckCircle className="success-icon" size={56} />
          <h1 className="success-title">Request Submitted Successfully</h1>
          <p className="success-message">
            Thank you for submitting your RMA request. We have received your information and will
            process your request as soon as possible.
          </p>
          <p className="success-details">
            You will receive a confirmation email shortly. Our support team will review your request
            and contact you within 1-2 business days.
          </p>
          <div className="success-actions">
            <Link href="/" className="btn btn-primary">
              Return to Home
            </Link>
            <Link href="/products" className="btn btn-outline">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

