import type { CollectionConfig, Endpoint } from 'payload'
import { APIError, addDataAndFileToRequest } from 'payload'

// File upload configuration for RMA requests
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
]

// Custom endpoint for secure file uploads for RMA requests
const uploadAttachmentEndpoint: Endpoint = {
  path: '/upload-attachment',
  method: 'post',
  handler: async (req) => {
    try {
      // Parse multipart form data using Payload helper
      await addDataAndFileToRequest(req)

      if (!req.file) {
        throw new APIError('No file provided', 400)
      }

      // Validate file size
      const fileSize = req.file.size || 0
      if (fileSize > MAX_FILE_SIZE) {
        throw new APIError(
          `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          400,
        )
      }

      // Validate file type
      const mimeType = req.file.mimetype || ''
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw new APIError(
          `File type not allowed. Allowed types: images (JPEG, PNG, GIF, WebP), PDF, Word documents, Excel files, and text files`,
          400,
        )
      }

      // Generate alt text from filename
      const filename = req.file.name || 'rma-attachment'
      const alt = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim() || 'RMA attachment'

      // Upload to media collection with overrideAccess to bypass access control
      // This is safe because we've already validated the file size and type
      const mediaDoc = await req.payload.create({
        collection: 'media',
        data: {
          alt: alt,
        },
        file: req.file,
        overrideAccess: true, // Bypass access control for this specific upload
      })

      return Response.json({
        success: true,
        doc: {
          id: mediaDoc.id,
          filename: mediaDoc.filename,
          mimeType: mediaDoc.mimeType,
        },
      })
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      console.error('Error uploading RMA attachment:', error)
      throw new APIError('Failed to upload file', 500)
    }
  },
}

export const RMARequests: CollectionConfig = {
  slug: 'rma-requests',
  endpoints: [uploadAttachmentEndpoint],
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'firstName', 'lastName', 'email', 'status', 'createdAt'],
    description: 'RMA (Return Merchandise Authorization) and Technical Support requests submitted by customers',
    components: {
      views: {
        edit: {
          default: {
            Component: '/payload/components/RMARequestPreview#RMARequestPreview',
            tab: {
              label: 'Preview',
            },
          },
        },
      },
    },
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      required: true,
      admin: {
        description: 'Customer email address for communication',
      },
    },
    {
      name: 'requestType',
      type: 'select',
      label: 'RMA/TECH Support?',
      options: [
        { label: 'RMA', value: 'rma' },
        { label: 'TECH Support', value: 'tech-support' },
      ],
      defaultValue: 'rma',
      required: true,
    },
    {
      name: 'onSite',
      type: 'radio',
      label: 'Are you on site?',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      required: true,
    },
    {
      name: 'phoneNumber',
      type: 'text',
      label: 'Phone Number',
      required: true,
    },
    {
      name: 'companyName',
      type: 'text',
      label: 'Company Name',
    },
    {
      name: 'address',
      type: 'group',
      label: 'Address',
      fields: [
        {
          name: 'line1',
          type: 'text',
          label: 'Address Line 1',
          required: true,
        },
        {
          name: 'line2',
          type: 'text',
          label: 'Address Line 2',
        },
        {
          name: 'city',
          type: 'text',
          label: 'City',
          required: true,
        },
        {
          name: 'state',
          type: 'text',
          label: 'State',
          required: true,
        },
        {
          name: 'zipCode',
          type: 'text',
          label: 'Zip Code',
          required: true,
        },
      ],
    },
    {
      name: 'invoiceDate',
      type: 'date',
      label: 'Invoice Date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'invoiceNumber',
      type: 'text',
      label: 'Invoice Number',
    },
    {
      name: 'serialNumber',
      type: 'text',
      label: 'Serial Number',
      required: true,
    },
    {
      name: 'model',
      type: 'text',
      label: 'Model',
    },
    {
      name: 'deviceLoginUsername',
      type: 'text',
      label: "Device Login Username (IP devices applicable)",
      required: true,
      admin: {
        description: 'If not applicable, please write n/a',
      },
    },
    {
      name: 'distributor',
      type: 'text',
      label: 'Which distributor did you buy products from?',
    },
    {
      name: 'subject',
      type: 'text',
      label: 'Subject',
      required: true,
    },
    {
      name: 'attachments',
      type: 'array',
      label: 'Attachments',
      fields: [
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
      admin: {
        description: 'Upload supporting documents, images, or files related to the RMA request',
      },
    },
    {
      name: 'problem',
      type: 'textarea',
      label: 'Problem Description',
      required: true,
      admin: {
        description: 'Please describe the problem in detail',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      options: [
        { label: 'New', value: 'new' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' },
      ],
      defaultValue: 'new',
      admin: {
        position: 'sidebar',
        description: 'Current status of the RMA request',
        components: {
          Cell: '/payload/components/StatusCell#StatusCell',
        },
      },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      label: 'Admin Notes',
      admin: {
        position: 'sidebar',
        description: 'Internal notes for admin use only',
        condition: (data, siblingData, { user }) => {
          // Only show to authenticated users (admins)
          return Boolean(user)
        },
      },
    },
  ],
  access: {
    // Anyone can create RMA requests (public form)
    create: () => true,
    // Only authenticated users (admins) can read all requests
    read: ({ req: { user } }) => {
      // Only logged-in users (admins) can view requests in the admin panel
      return Boolean(user)
    },
    // Only authenticated users (admins) can update
    update: ({ req: { user } }) => {
      return Boolean(user)
    },
    // Only authenticated users (admins) can delete
    delete: ({ req: { user } }) => {
      return Boolean(user)
    },
  },
  timestamps: true,
}

