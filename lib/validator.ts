import * as z from "zod"

export const eventFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(3, 'Description must be at least 3 characters').max(400, 'Description must be less than 400 characters'),
  location: z.string().min(3, 'Location must be at least 3 characters').max(400, 'Location must be less than 400 characters'),
  imageUrl: z.string(),
  startDateTime: z.date(),
  endDateTime: z.date(),
  categoryId: z.string(),
  url: z.string().url(),
  postedBy: z.enum(['admin', 'organizer', 'student']),
  organizerInfo: z.object({
    name:      z.string().min(2, 'Name must be at least 2 characters'),
    email:     z.string().email('Please enter a valid email'),
    instagram: z.string().optional(),
    linkedin:  z.string().optional(),
  }).optional(),
}).refine((data) => {
  if (data.postedBy === 'organizer' || data.postedBy === 'student') {
    return !!data.organizerInfo?.name && !!data.organizerInfo?.email
  }
  return true
}, {
  message: 'Name and email are required',
  path: ['organizerInfo'],
})