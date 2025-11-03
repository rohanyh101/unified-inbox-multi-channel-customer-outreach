import { z } from 'zod'

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).default('VIEWER'),
})

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).optional(),
})

// Contact schemas
export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number').optional(),
  email: z.string().email('Invalid email address').optional(),
  socialHandles: z.record(z.string(), z.string()).optional(),
})

export const updateContactSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number').optional(),
  email: z.string().email('Invalid email address').optional(),
  socialHandles: z.record(z.string(), z.string()).optional(),
})

// Message schemas
export const sendMessageSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  content: z.string().min(1, 'Message content is required'),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL']),
  mediaUrl: z.string().url('Invalid media URL').optional(),
})

export const createMessageSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  content: z.string().min(1, 'Message content is required'),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL']),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  mediaUrl: z.string().url('Invalid media URL').optional(),
  twilioSid: z.string().optional(),
})

// Note schemas
export const createNoteSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  content: z.string().min(1, 'Note content is required'),
  isPrivate: z.boolean().default(false),
})

export const updateNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required').optional(),
  isPrivate: z.boolean().optional(),
})

// Scheduled message schemas
export const scheduleMessageSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  content: z.string().min(1, 'Message content is required'),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL']),
  scheduledAt: z.string().datetime('Invalid datetime format'),
  mediaUrl: z.string().url('Invalid media URL').optional(),
})

// Twilio webhook schema
export const twilioWebhookSchema = z.object({
  MessageSid: z.string(),
  From: z.string(),
  To: z.string(),
  Body: z.string().optional(),
  NumMedia: z.string().optional(),
  MediaUrl0: z.string().optional(),
  MediaUrl1: z.string().optional(),
  MediaUrl2: z.string().optional(),
  MediaUrl3: z.string().optional(),
  MediaUrl4: z.string().optional(),
})

// Query schemas with proper defaults
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export const messageFiltersSchema = z.object({
  contactId: z.string().optional(),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL']).optional(),
  direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
  search: z.string().optional(),
}).merge(paginationSchema)

export const contactFiltersSchema = z.object({
  search: z.string().optional(),
}).merge(paginationSchema)

// Analytics schemas
export const analyticsDateRangeSchema = z.object({
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
})

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type CreateMessageInput = z.infer<typeof createMessageSchema>
export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type ScheduleMessageInput = z.infer<typeof scheduleMessageSchema>
export type TwilioWebhookInput = z.infer<typeof twilioWebhookSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type MessageFiltersInput = z.infer<typeof messageFiltersSchema>
export type ContactFiltersInput = z.infer<typeof contactFiltersSchema>
export type AnalyticsDateRangeInput = z.infer<typeof analyticsDateRangeSchema>
